import { User } from 'src/users/entities/user.entity';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('auth_sessions')
export class AuthSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Login tracking
    @Column({ name: 'last_login', type: 'timestamp', nullable: true })
    lastLogin: Date | null;

    @Column({ name: 'last_login_ip', nullable: true, type: 'varchar', length: 45 })
    lastLoginIp: string | null;

    @Column({ name: 'last_login_user_agent', nullable: true, type: 'varchar', length: 512 })
    lastLoginUserAgent: string | null;

    // Failed attempts tracking
    @Column({ name: 'failed_login_attempts', default: 0,type: 'int' })
    failedLoginAttempts: number;

    @Column({ name: 'last_failed_login', type: 'timestamp', nullable: true })
    lastFailedLogin: Date | null;

    @Column({ name: 'lock_until', type: 'timestamp', nullable: true })
    lockUntil: Date | null;

    // Session activity
    @Column({ name: 'is_online', default: false , type: 'boolean'})
    isOnline: boolean;

    @Column({ name: 'last_activity', type: 'timestamp', nullable: true })
    lastActivity: Date | null;

    // Device/browser info
    @Column({ name: 'device_type', nullable: true, type: 'varchar' })
    deviceType: string | null; // 'mobile', 'tablet', 'desktop'

    @Column({ name: 'browser', nullable: true, type: 'varchar' })
    browser: string | null;

    @Column({ name: 'os', nullable: true, type: 'varchar' })
    os: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.authSessions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    // Security methods
    isLocked(): boolean {
        return this.lockUntil ? this.lockUntil > new Date() : false;
    }

    recordSuccessfulLogin(ip?: string, userAgent?: string): void {
        this.lastLogin = new Date();
        if (ip)this.lastLoginIp = ip;
        if(userAgent)this.lastLoginUserAgent = userAgent;
        this.failedLoginAttempts = 0;
        this.lockUntil = null;
        this.isOnline = true;
        this.lastActivity = new Date();
    }

    recordFailedLogin(): void {
        this.failedLoginAttempts += 1;
        this.lastFailedLogin = new Date();

        // Lock after 5 failed attempts for 30 minutes
        if (this.failedLoginAttempts >= 4) {
            const lockTime = new Date();
            lockTime.setMinutes(lockTime.getMinutes() + 30);
            this.lockUntil = lockTime;
        }
    }

    recordActivity(): void {
        this.lastActivity = new Date();
        this.isOnline = true;
    }

    logout(): void {
        this.isOnline = false;
    }

    // Device info parsing
    setDeviceInfo(userAgent: string): void {
        // Simple parsing (in real app, use a library like ua-parser-js)
        if (userAgent.includes('Mobile')) {
            this.deviceType = 'mobile';
        } else if (userAgent.includes('Tablet')) {
            this.deviceType = 'tablet';
        } else {
            this.deviceType = 'desktop';
        }

        if (userAgent.includes('Chrome')) this.browser = 'Chrome';
        else if (userAgent.includes('Firefox')) this.browser = 'Firefox';
        else if (userAgent.includes('Safari')) this.browser = 'Safari';
        else this.browser = 'Other';

        if (userAgent.includes('Windows')) this.os = 'Windows';
        else if (userAgent.includes('Mac')) this.os = 'macOS';
        else if (userAgent.includes('Linux')) this.os = 'Linux';
        else if (userAgent.includes('Android')) this.os = 'Android';
        else if (userAgent.includes('iOS')) this.os = 'iOS';
        else this.os = 'Unknown';
    }
}