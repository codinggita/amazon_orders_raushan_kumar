import crypto from 'crypto';

/**
 * Express middleware to inject and enforce unique correlation IDs (traceId) 
 * for every incoming HTTP request to facilitate absolute observability.
 */
export const requestTracer = (req, res, next) => {
  // Capture trace ID from headers if passed by an upstream proxy/gateway,
  // or generate a new high-entropy cryptographically secure UUID.
  const traceId = req.headers['x-trace-id'] || crypto.randomUUID();
  
  // Attach correlation ID to request object for downstream accessibility
  req.traceId = traceId;
  
  // Expose correlation ID to client response headers
  res.setHeader('x-trace-id', traceId);
  
  next();
};

export default requestTracer;
