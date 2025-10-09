---
layout: page
title: Troubleshooting Guide
permalink: /guides/troubleshooting/
---

# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with Kubently deployments.

## Common Issues

### Executor Connection Problems

#### Executor Not Connecting to API

**Symptoms:**
- Executor logs show connection refused errors
- Commands don't reach the executor
- Cluster shows as unavailable in API

**Diagnosis:**
```bash
# Check executor logs
kubectl logs -l app=kubently-executor -n kubently --tail=50

# Verify API service is running
kubectl get svc kubently-api -n kubently

# Test network connectivity from executor
kubectl exec -it deploy/kubently-executor -n kubently -- \
  curl -v http://kubently-api:8080/health
```

**Solutions:**
1. **Network Policy Issues**: Ensure network policies allow executor→API communication
2. **Service Discovery**: Verify DNS resolution works within cluster
3. **API Service**: Check if API pods are running and healthy
4. **Firewall Rules**: For multi-cluster setups, check firewall rules

### Getting Help

If you're still experiencing issues:

1. **Check Documentation**: Review [Architecture](/architecture/) and [Installation](/installation/) guides
2. **Search Issues**: Look for similar issues on [GitHub](https://github.com/kubently/kubently/issues)
3. **Ask Community**: Post in GitHub Discussions
4. **File Bug Report**: Create detailed issue with logs and reproduction steps

## Next Steps

- [Security Guide](/guides/security/) - Security best practices
- [Architecture](/architecture/) - System design details
- [API Reference](/api/) - Complete API documentation
- [Basic Usage](/guides/basic-usage/) - Getting started guide
