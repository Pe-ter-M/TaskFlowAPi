// src/services/client-info.service.ts
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';

@Injectable()
export class ClientInfoService {
  // Don't create instance in constructor, just import the class
  constructor() {
    // No need to initialize UAParser here
  }

  extractFromRequest(req: Request) {
    const userAgent = req.headers['user-agent'] || '';
    
    // Create parser instance WITH the user agent
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
   
    // Get IP address
    const ip = this.getClientIp(req);
    
    // Format results
    return {
      browser: {
        name: result.browser.name || 'Unknown',
        version: result.browser.version || '',
        full: result.browser.name 
          ? `${result.browser.name} ${result.browser.version || ''}`.trim()
          : 'Unknown Browser'
      },
      os: {
        name: result.os.name || 'Unknown',
        version: result.os.version || '',
        full: result.os.name
          ? `${result.os.name} ${result.os.version || ''}`.trim()
          : 'Unknown OS'
      },
      device: {
        type: result.device.type || 'desktop',
        model: result.device.model || 'Unknown',
        vendor: result.device.vendor || 'Unknown',
        full: `${result.device.type || 'desktop'} ${result.device.vendor || 'Unknown'} ${result.device.model || 'Unknown'}`
      },
      ip: ip,
      userAgent: userAgent,
      timestamp: new Date()
    };
  }

  private getClientIp(req: Request): string {
    const reqAny = req as any;
    
    // Check proxy headers first
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ip.split(',')[0].trim().replace('::ffff:', '');
    }
    
    // Fallback methods
    return (
      req.ip ||
      reqAny.connection?.remoteAddress ||
      reqAny.socket?.remoteAddress ||
      'unknown'
    ).replace('::ffff:', '');
  }
}