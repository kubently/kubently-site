---
layout: page
title: Troubleshooting
permalink: /guides/troubleshooting/
---

# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with Kubently deployments.

## Common Issues

### API Service Issues

#### API Service Not Starting

**Symptoms:**
- API pods in `CrashLoopBackOff` state
- Connection refused errors when accessing API

**Diagnosis:**
```bash
# Check pod status
kubectl get pods -n kubently -l app=kubently-api

# Check logs
kubectl logs -n kubently -l app=kubently-api --tail=50

# Check events
kubectl get events -n kubently --sort-by=.metadata.creationTimestamp
```

**Common Causes and Solutions:**

1. **Redis Connection Issues**
   ```bash
   # Check Redis status
   kubectl get pods -n kubently -l app=redis
   
   # Test Redis connectivity
   kubectl run redis-test --rm -i --tty --image redis:7-alpine -- redis-cli -h redis -p 6379 ping
   
   # Check Redis URL configuration
   kubectl get configmap kubently-api-config -n kubently -o yaml
   ```

2. **Missing or Invalid Configuration**
   ```bash
   # Check required environment variables
   kubectl describe deployment kubently-api -n kubently
   
   # Verify secrets exist
   kubectl get secrets -n kubently
   
   # Check secret contents (be careful with sensitive data)
   kubectl get secret kubently-api-config -n kubently -o yaml
   ```

3. **Port Conflicts**
   ```bash
   # Check if port 8080 is available
   kubectl get services -n kubently
   
   # Check for conflicting services
   kubectl get services --all-namespaces | grep 8080
   ```

#### API Returning 500 Errors

**Symptoms:**
- API returns internal server errors
- Intermittent failures

**Diagnosis:**
```bash
# Check detailed API logs
kubectl logs -n kubently -l app=kubently-api --tail=100 -f

# Check resource usage
kubectl top pods -n kubently

# Check for memory/CPU limits
kubectl describe pods -n kubently -l app=kubently-api
```

**Solutions:**

1. **Increase Resource Limits**
   ```yaml
   resources:
     limits:
       memory: "1Gi"
       cpu: "1000m"
     requests:
       memory: "512Mi"
       cpu: "500m"
   ```

2. **Check Redis Memory Usage**
   ```bash
   # Connect to Redis and check memory
   kubectl exec -it deployment/redis -n kubently -- redis-cli info memory
   ```

### Agent Issues

#### Agent Not Connecting

**Symptoms:**
- Agent logs show connection errors
- Commands not being executed
- Cluster shows as "disconnected"

**Diagnosis:**
```bash
# Check agent status
kubectl get pods -n kubently -l app=kubently-agent

# Check agent logs
kubectl logs -n kubently -l app=kubently-agent --tail=50

# Test network connectivity
kubectl exec -it deployment/kubently-agent -n kubently -- \
  curl -v http://kubently-api:8080/health
```

**Common Causes and Solutions:**

1. **Network Connectivity Issues**
   ```bash
   # Check service endpoints
   kubectl get endpoints kubently-api -n kubently
   
   # Check network policies
   kubectl get networkpolicies -n kubently
   
   # Test DNS resolution
   kubectl exec -it deployment/kubently-agent -n kubently -- \
     nslookup kubently-api
   ```

2. **Authentication Issues**
   ```bash
   # Check agent token secret
   kubectl get secret kubently-agent-token -n kubently -o yaml
   
   # Verify token matches API configuration
   kubectl get secret kubently-api-config -n kubently -o yaml
   ```

3. **API URL Configuration**
   ```bash
   # Check agent environment variables
   kubectl describe deployment kubently-agent -n kubently
   
   # Verify API URL is correct
   kubectl get services kubently-api -n kubently
   ```

#### Agent Authentication Failures

**Symptoms:**
- Agent logs show 401/403 errors
- Commands queued but not executed

**Diagnosis:**
```bash
# Check agent logs for auth errors
kubectl logs -n kubently -l app=kubently-agent | grep -i auth

# Check API logs for auth failures
kubectl logs -n kubently -l app=kubently-api | grep -i auth
```

**Solutions:**

1. **Regenerate Agent Token**
   ```bash
   # Generate new token
   NEW_TOKEN=$(openssl rand -hex 32)
   
   # Update agent secret
   kubectl patch secret kubently-agent-token -n kubently \
     --type='json' \
     -p="[{\"op\": \"replace\", \"path\": \"/data/token\", \"value\": \"$(echo -n $NEW_TOKEN | base64)\"}]"
   
   # Update API configuration with new token
   kubectl patch secret kubently-api-config -n kubently \
     --type='json' \
     -p="[{\"op\": \"replace\", \"path\": \"/data/agent-tokens\", \"value\": \"$(echo -n "{\"default\":\"$NEW_TOKEN\"}" | base64)\"}]"
   
   # Restart both services
   kubectl rollout restart deployment kubently-agent -n kubently
   kubectl rollout restart deployment kubently-api -n kubently
   ```

### Command Execution Issues

#### Commands Timing Out

**Symptoms:**
- Commands return timeout errors
- Long delay in command execution

**Diagnosis:**
```bash
# Check command execution logs
kubectl logs -n kubently -l app=kubently-agent | grep -i timeout

# Check cluster performance
kubectl top nodes
kubectl top pods -A
```

**Solutions:**

1. **Increase Command Timeout**
   ```bash
   # When making API calls, increase timeout
   curl -X POST http://api-endpoint/debug/execute \
     -H "Content-Type: application/json" \
     -d '{
       "cluster_id": "default",
       "session_id": "sess_123",
       "command_type": "get",
       "args": ["pods", "-A"],
       "timeout": 60
     }'
   ```

2. **Check Kubernetes API Server Health**
   ```bash
   # Test kubectl performance directly
   time kubectl get pods -A
   
   # Check API server logs (if accessible)
   kubectl logs -n kube-system kube-apiserver-*
   ```

#### Commands Being Rejected

**Symptoms:**
- Commands return "forbidden" or "invalid command" errors
- Specific kubectl commands not working

**Diagnosis:**
```bash
# Check agent logs for command validation errors
kubectl logs -n kubently -l app=kubently-agent | grep -i "forbidden\|invalid"

# Check RBAC permissions
kubectl auth can-i get pods --as=system:serviceaccount:kubently:kubently-agent
kubectl auth can-i list nodes --as=system:serviceaccount:kubently:kubently-agent
```

**Solutions:**

1. **Review RBAC Permissions**
   ```bash
   # Check current ClusterRole
   kubectl get clusterrole kubently-agent -o yaml
   
   # Check ClusterRoleBinding
   kubectl get clusterrolebinding kubently-agent -o yaml
   
   # Test specific permissions
   kubectl auth can-i get pods --as=system:serviceaccount:kubently:kubently-agent -n default
   ```

2. **Check Command Whitelist**
   - Review allowed commands in agent configuration
   - Ensure command type and arguments are permitted

### Performance Issues

#### Slow Response Times

**Symptoms:**
- Commands take longer than expected to execute
- API responses are slow

**Diagnosis:**
```bash
# Check resource usage
kubectl top pods -n kubently
kubectl top nodes

# Check Redis performance
kubectl exec -it deployment/redis -n kubently -- redis-cli --latency-history

# Monitor API response times
curl -w "Total: %{time_total}s\n" -o /dev/null -s http://api-endpoint/health
```

**Solutions:**

1. **Scale API Service**
   ```bash
   kubectl scale deployment kubently-api -n kubently --replicas=3
   ```

2. **Optimize Redis Configuration**
   ```bash
   # Increase Redis memory (if needed)
   kubectl patch deployment redis -n kubently -p \
     '{"spec":{"template":{"spec":{"containers":[{"name":"redis","resources":{"limits":{"memory":"2Gi"}}}]}}}}'
   ```

3. **Tune Agent Polling**
   ```yaml
   # Adjust polling intervals
   env:
   - name: POLL_INTERVAL
     value: "5"  # Reduce from default 10
   - name: FAST_POLL_INTERVAL
     value: "0.2"  # Reduce from default 0.5
   ```

#### High Memory Usage

**Symptoms:**
- Pods being OOMKilled
- High memory usage in monitoring

**Diagnosis:**
```bash
# Check memory usage
kubectl top pods -n kubently

# Check for memory leaks
kubectl exec -it deployment/kubently-api -n kubently -- \
  ps aux | grep python

# Check Redis memory usage
kubectl exec -it deployment/redis -n kubently -- \
  redis-cli info memory
```

**Solutions:**

1. **Increase Memory Limits**
   ```yaml
   resources:
     limits:
       memory: "2Gi"
     requests:
       memory: "1Gi"
   ```

2. **Configure Redis Memory Policy**
   ```bash
   kubectl patch deployment redis -n kubently -p \
     '{"spec":{"template":{"spec":{"containers":[{"name":"redis","command":["redis-server","--maxmemory","1gb","--maxmemory-policy","allkeys-lru"]}]}}}}'
   ```

## Diagnostic Tools

### Health Check Script

```bash
#!/bin/bash
# kubently-health-check.sh

echo "=== Kubently Health Check ==="

# Check namespace
echo "Checking namespace..."
kubectl get namespace kubently || echo "❌ Namespace kubently not found"

# Check pods
echo "Checking pods..."
kubectl get pods -n kubently

# Check services
echo "Checking services..."
kubectl get services -n kubently

# Check secrets
echo "Checking secrets..."
kubectl get secrets -n kubently

# Test API health
echo "Testing API health..."
API_ENDPOINT=$(kubectl get service kubently-api -n kubently -o jsonpath='{.spec.clusterIP}')
kubectl run test-pod --rm -i --tty --image=curlimages/curl -- \
  curl -s http://$API_ENDPOINT:8080/health

# Check logs for errors
echo "Checking for errors in logs..."
kubectl logs -n kubently -l app=kubently-api --tail=10 | grep -i error
kubectl logs -n kubently -l app=kubently-agent --tail=10 | grep -i error
```

### Log Analysis Script

```bash
#!/bin/bash
# kubently-log-analysis.sh

echo "=== Log Analysis ==="

# API errors
echo "API errors in the last hour:"
kubectl logs -n kubently -l app=kubently-api --since=1h | grep -i "error\|exception\|failed"

# Agent errors
echo "Agent errors in the last hour:"
kubectl logs -n kubently -l app=kubently-agent --since=1h | grep -i "error\|exception\|failed"

# Authentication issues
echo "Authentication issues:"
kubectl logs -n kubently -l app=kubently-api --since=1h | grep -i "auth\|401\|403"

# Connection issues
echo "Connection issues:"
kubectl logs -n kubently -l app=kubently-agent --since=1h | grep -i "connection\|timeout\|refused"
```

### Performance Monitoring

```bash
#!/bin/bash
# kubently-performance.sh

echo "=== Performance Monitoring ==="

# Resource usage
echo "Resource usage:"
kubectl top pods -n kubently

# API response time test
echo "API response time test:"
start_time=$(date +%s.%N)
kubectl run test-pod --rm -i --tty --image=curlimages/curl -- \
  curl -s http://kubently-api:8080/health > /dev/null
end_time=$(date +%s.%N)
echo "Response time: $(echo "$end_time - $start_time" | bc)s"

# Redis performance
echo "Redis performance:"
kubectl exec -it deployment/redis -n kubently -- \
  redis-cli info stats | grep -E "total_commands_processed|instantaneous_ops_per_sec"
```

## Recovery Procedures

### Complete Service Recovery

```bash
#!/bin/bash
# kubently-recovery.sh

echo "=== Kubently Recovery Procedure ==="

# Step 1: Check current state
kubectl get all -n kubently

# Step 2: Restart services
echo "Restarting services..."
kubectl rollout restart deployment kubently-api -n kubently
kubectl rollout restart deployment kubently-agent -n kubently
kubectl rollout restart deployment redis -n kubently

# Step 3: Wait for rollout
kubectl rollout status deployment kubently-api -n kubently --timeout=300s
kubectl rollout status deployment kubently-agent -n kubently --timeout=300s
kubectl rollout status deployment redis -n kubently --timeout=300s

# Step 4: Verify health
echo "Verifying health..."
kubectl get pods -n kubently
sleep 30
./kubently-health-check.sh
```

### Data Recovery

```bash
# If Redis data is corrupted or lost
kubectl delete deployment redis -n kubently
kubectl apply -f deployment/kubernetes/redis/

# Wait for Redis to be ready
kubectl wait --for=condition=Ready pod -l app=redis -n kubently --timeout=300s

# All sessions and temporary data will be lost
# Agents will automatically reconnect
```

## Getting Help

### Information to Gather

When reporting issues, please include:

1. **Environment Information**
   ```bash
   kubectl version --short
   kubectl get nodes
   kubectl get pods -n kubently -o wide
   ```

2. **Configuration**
   ```bash
   kubectl get configmaps -n kubently -o yaml
   kubectl describe deployments -n kubently
   ```

3. **Logs** (last 100 lines)
   ```bash
   kubectl logs -n kubently -l app=kubently-api --tail=100
   kubectl logs -n kubently -l app=kubently-agent --tail=100
   ```

4. **Error Messages**
   - Exact error messages from API responses
   - Timestamps when issues occurred
   - Steps to reproduce the problem

### Support Channels

1. **GitHub Issues**: [Report bugs](https://github.com/adickinson/kubently/issues)
2. **Documentation**: Check this troubleshooting guide
3. **Community**: GitHub Discussions for questions

### Emergency Contacts

For critical production issues:
1. Check monitoring and alerting systems
2. Follow your organization's incident response procedures
3. Consider rolling back to previous working version

Remember: Most issues can be resolved by restarting the affected services and checking configuration! 🔧