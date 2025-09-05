---
layout: page
title: Security Guide
permalink: /guides/security/
---

# Security Guide

Security is a core principle in Kubently's design. This guide covers security best practices for deploying and using Kubently in production environments.

## Security Architecture

### Defense in Depth

Kubently implements multiple security layers:

1. **Authentication**: API keys and agent tokens
2. **Authorization**: RBAC and command validation
3. **Network Security**: Controlled network access
4. **Command Security**: Read-only operations only
5. **Data Security**: Minimal data storage and encryption

### Threat Model

**Protected Against:**
- Unauthorized cluster access
- Command injection attacks
- Privilege escalation
- Data exfiltration
- Network-based attacks

**Out of Scope:**
- Kubernetes cluster security (assumed secure)
- Physical security
- Social engineering attacks

## Authentication and Authorization

### API Key Management

**Generation:**
```bash
# Generate cryptographically secure API keys
openssl rand -base64 32
# Or use Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Storage:**
```bash
# Store in Kubernetes secrets
kubectl create secret generic kubently-api-config \
  --from-literal=api-keys="key1,key2,key3" \
  -n kubently

# Use environment variables for development
export KUBENTLY_API_KEYS="dev-key-1,dev-key-2"
```

**Rotation:**
```bash
# Add new key while keeping old ones active
kubectl patch secret kubently-api-config -n kubently \
  --type='json' \
  -p='[{"op": "replace", "path": "/data/api-keys", "value": "'$(echo -n "old-key,new-key" | base64)'"}]'

# Remove old keys after transition period
kubectl patch secret kubently-api-config -n kubently \
  --type='json' \
  -p='[{"op": "replace", "path": "/data/api-keys", "value": "'$(echo -n "new-key" | base64)'"}]'
```

### Agent Token Security

**Per-Cluster Tokens:**
```bash
# Generate unique token for each cluster
export CLUSTER_A_TOKEN=$(openssl rand -hex 32)
export CLUSTER_B_TOKEN=$(openssl rand -hex 32)

# Create agent tokens secret
kubectl create secret generic kubently-api-config \
  --from-literal=agent-tokens="{\"cluster-a\":\"$CLUSTER_A_TOKEN\",\"cluster-b\":\"$CLUSTER_B_TOKEN\"}" \
  -n kubently
```

**Token Rotation:**
```bash
# Update agent token in secret
kubectl patch secret kubently-agent-token -n kubently \
  --type='json' \
  -p='[{"op": "replace", "path": "/data/token", "value": "'$(echo -n "$NEW_TOKEN" | base64)'"}]'

# Restart agent to pick up new token
kubectl rollout restart deployment kubently-agent -n kubently
```

## Kubernetes RBAC

### Minimal Agent Permissions

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: kubently-agent-minimal
rules:
# Core resources - read only
- apiGroups: [""]
  resources: ["pods", "nodes", "services", "endpoints", "events", "namespaces"]
  verbs: ["get", "list", "watch"]

# Apps - read only
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets", "daemonsets", "statefulsets"]
  verbs: ["get", "list", "watch"]

# Networking - read only
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses", "networkpolicies"]
  verbs: ["get", "list", "watch"]

# Storage - read only
- apiGroups: ["storage.k8s.io"]
  resources: ["storageclasses", "persistentvolumes"]
  verbs: ["get", "list", "watch"]

# Explicitly deny dangerous operations
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["create", "delete", "update", "patch", "deletecollection"]
  resourceNames: ["*"]
  # This rule is never matched due to explicit deny
```

### Namespace-Scoped Deployment

```yaml
# For namespace-scoped debugging only
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: kubently-agent-ns
rules:
- apiGroups: [""]
  resources: ["pods", "services", "endpoints", "events"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: kubently-agent-ns
  namespace: production
subjects:
- kind: ServiceAccount
  name: kubently-agent
  namespace: kubently
roleRef:
  kind: Role
  name: kubently-agent-ns
  apiGroup: rbac.authorization.k8s.io
```

## Command Security

### Command Validation

Kubently validates all commands against a whitelist:

```python
# Allowed command types
ALLOWED_COMMANDS = {
    "get": ["pods", "nodes", "services", "deployments", "events", "namespaces"],
    "describe": ["pod", "node", "service", "deployment", "event"],
    "explain": ["*"],  # Safe - just returns documentation
    "version": [],     # No arguments needed
    "cluster-info": ["dump"]  # Read-only cluster information
}

# Forbidden arguments
FORBIDDEN_ARGS = [
    "--dry-run=server",  # Could cause server-side effects
    "--export",          # Deprecated and potentially dangerous
    "-o=custom-columns-file",  # Could read arbitrary files
    "--raw",            # Bypasses normal output formatting
]
```

### Argument Sanitization

```python
def sanitize_kubectl_args(command_type: str, args: List[str]) -> List[str]:
    """Sanitize kubectl arguments for security."""
    
    # Remove dangerous arguments
    sanitized = []
    for arg in args:
        if any(forbidden in arg for forbidden in FORBIDDEN_ARGS):
            continue
        
        # Sanitize output formats
        if arg.startswith("-o="):
            allowed_formats = ["json", "yaml", "wide", "name"]
            format_type = arg.split("=", 1)[1]
            if format_type not in allowed_formats:
                continue
        
        sanitized.append(arg)
    
    return sanitized
```

## Network Security

### Network Policies

```yaml
# Restrict API service network access
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: kubently-api-netpol
  namespace: kubently
spec:
  podSelector:
    matchLabels:
      app: kubently-api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector: {} # Allow from any namespace
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to: []  # Redis access
    ports:
    - protocol: TCP
      port: 6379
  - to: []  # DNS resolution
    ports:
    - protocol: UDP
      port: 53
---
# Restrict agent network access
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: kubently-agent-netpol
  namespace: kubently
spec:
  podSelector:
    matchLabels:
      app: kubently-agent
  policyTypes:
  - Ingress
  - Egress
  ingress: []  # No inbound connections
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kubently
    - podSelector:
        matchLabels:
          app: kubently-api
    ports:
    - protocol: TCP
      port: 8080
  - to: []  # Kubernetes API server
    ports:
    - protocol: TCP
      port: 443
  - to: []  # DNS resolution
    ports:
    - protocol: UDP
      port: 53
```

### TLS Configuration

```yaml
# TLS for API service
apiVersion: v1
kind: Secret
metadata:
  name: kubently-tls
  namespace: kubently
type: kubernetes.io/tls
data:
  tls.crt: <base64-encoded-certificate>
  tls.key: <base64-encoded-private-key>
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: kubently-api-ingress
  namespace: kubently
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - kubently.example.com
    secretName: kubently-tls
  rules:
  - host: kubently.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: kubently-api
            port:
              number: 8080
```

## Data Security

### Sensitive Data Handling

**What Kubently Stores:**
- Session metadata (no sensitive data)
- Command arguments (filtered)
- Command results (TTL-based cleanup)
- Authentication tokens (encrypted)

**What Kubently Does NOT Store:**
- Kubernetes secrets content
- Private keys or certificates
- User passwords
- Persistent logs of sensitive operations

### Data Encryption

```yaml
# Enable Redis AUTH
apiVersion: v1
kind: Secret
metadata:
  name: redis-auth
  namespace: kubently
data:
  password: <base64-encoded-password>
---
# Redis with AUTH enabled
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: kubently
spec:
  template:
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        command:
        - redis-server
        - --requirepass $(REDIS_PASSWORD)
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-auth
              key: password
```

### Data Retention

```python
# Automatic cleanup configuration
SESSION_TTL = 3600  # 1 hour
RESULT_TTL = 300    # 5 minutes
INACTIVE_SESSION_CLEANUP = 1800  # 30 minutes

# Redis TTL configuration
redis.setex(f"session:{session_id}", SESSION_TTL, session_data)
redis.setex(f"result:{result_id}", RESULT_TTL, result_data)
```

## Security Monitoring

### Audit Logging

```python
# Security-relevant events to log
SECURITY_EVENTS = [
    "authentication_failure",
    "unauthorized_command_attempt", 
    "session_creation",
    "session_termination",
    "agent_connection_failure",
    "rate_limit_exceeded"
]

# Structured security log format
{
    "timestamp": "2024-01-20T10:30:45Z",
    "event_type": "authentication_failure",
    "source_ip": "192.168.1.100",
    "api_key_prefix": "dev-key...",
    "cluster_id": "production",
    "details": {
        "reason": "invalid_api_key",
        "user_agent": "kubently-cli/1.0.0"
    }
}
```

### Monitoring Rules

```yaml
# Prometheus alerting rules
groups:
- name: kubently.security
  rules:
  - alert: KubentlyAuthenticationFailures
    expr: rate(kubently_auth_failures_total[5m]) > 0.1
    for: 2m
    annotations:
      summary: High rate of authentication failures
      description: "Authentication failure rate is {{ $value }} per second"
  
  - alert: KubentlyUnauthorizedCommands
    expr: increase(kubently_unauthorized_commands_total[5m]) > 0
    for: 0m
    annotations:
      summary: Unauthorized command attempts detected
      description: "{{ $value }} unauthorized commands in the last 5 minutes"

  - alert: KubentlyAgentDisconnected
    expr: kubently_agent_connected == 0
    for: 5m
    annotations:
      summary: Kubently agent disconnected
      description: "Agent for cluster {{ $labels.cluster_id }} has been disconnected for 5+ minutes"
```

## Security Best Practices

### Deployment Security

1. **Use Dedicated Namespace**
   ```bash
   kubectl create namespace kubently
   kubectl label namespace kubently security.policy=strict
   ```

2. **Pod Security Standards**
   ```yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: kubently
     labels:
       pod-security.kubernetes.io/enforce: restricted
       pod-security.kubernetes.io/audit: restricted
       pod-security.kubernetes.io/warn: restricted
   ```

3. **Security Context**
   ```yaml
   securityContext:
     runAsNonRoot: true
     runAsUser: 65534
     runAsGroup: 65534
     fsGroup: 65534
     allowPrivilegeEscalation: false
     capabilities:
       drop:
       - ALL
     readOnlyRootFilesystem: true
   ```

### Operational Security

1. **Regular Security Reviews**
   - Review RBAC permissions quarterly
   - Audit access logs monthly
   - Update dependencies regularly
   - Rotate credentials on schedule

2. **Incident Response**
   - Monitor for suspicious activities
   - Have incident response procedures
   - Maintain security contact information
   - Document security incidents

3. **Access Management**
   - Use principle of least privilege
   - Regular access reviews
   - Automated credential rotation
   - Multi-factor authentication for admin access

### Development Security

1. **Secure Coding Practices**
   - Input validation on all endpoints
   - SQL injection prevention (not applicable - no SQL)
   - Command injection prevention
   - Regular security testing

2. **Dependency Management**
   - Regular dependency updates
   - Security vulnerability scanning
   - Pin dependency versions
   - Use minimal base images

## Compliance Considerations

### SOC 2 Type II

- Implement comprehensive logging
- Regular access reviews
- Incident response procedures
- Data encryption at rest and in transit

### ISO 27001

- Risk assessment and management
- Security policies and procedures
- Regular security training
- Continuous monitoring

### CIS Kubernetes Benchmark

- Follow CIS recommendations for Kubernetes
- Regular compliance scanning
- Automated compliance reporting
- Remediation tracking

## Security Checklist

### Pre-Deployment

- [ ] Review and customize RBAC permissions
- [ ] Generate strong API keys and agent tokens
- [ ] Configure network policies
- [ ] Enable TLS encryption
- [ ] Set up monitoring and alerting
- [ ] Review security context settings
- [ ] Validate image security (scan for vulnerabilities)

### Post-Deployment

- [ ] Verify RBAC is working correctly
- [ ] Test authentication mechanisms
- [ ] Validate command filtering
- [ ] Check network isolation
- [ ] Review audit logs
- [ ] Test incident response procedures
- [ ] Document security configuration

### Ongoing Maintenance

- [ ] Rotate credentials regularly
- [ ] Update dependencies
- [ ] Review access logs
- [ ] Monitor security alerts
- [ ] Conduct security assessments
- [ ] Update security documentation
- [ ] Train team on security practices

## Getting Security Help

For security issues:
1. **Security vulnerabilities**: Email security@kubently.io (if available)
2. **Security questions**: Create GitHub discussion with `security` label
3. **Configuration help**: Consult this guide and architecture documentation

Remember: Security is everyone's responsibility! 🔒