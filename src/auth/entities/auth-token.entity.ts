import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TokenType {
  REFRESH = 'refresh',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  API_ACCESS = 'api_access',
}

@Entity('auth_tokens')
export class AuthToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: TokenType,
  })
  type: TokenType;

  @Column({ name: 'token_hash', type: 'varchar' })
  @Index()
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'revoked', default: false, type: 'boolean' })
  revoked: boolean;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.authTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Token validation
  isValid(): boolean {
    return !this.revoked && this.expiresAt > new Date();
  }

  // Revoke token
  revoke(): void {
    this.revoked = true;
    this.revokedAt = new Date();
  }

  // Check if token matches
  matchesToken(token: string): boolean {
    // In practice, you'd hash the token and compare
    // For now, we'll assume tokenHash is the actual token
    return this.tokenHash === token;
  }
}