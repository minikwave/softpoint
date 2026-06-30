import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by paypoint routes when USER_JWT_SECRET is configured (JWT `sub`). */
    jwtUserId?: string;
  }
}
