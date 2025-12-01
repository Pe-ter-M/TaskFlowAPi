import { User } from 'src/users/entities/user.entity';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BeforeUpdate,
    OneToOne,
} from 'typeorm';

@Entity('auth_sessions')
export class AuthSecurity {
    // Configuration variables (easily adjustable)
    private static MAX_FAILED_ATTEMPTS = 4;
    private static LOCK_DURATION_MINUTES = 2;

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
    @Column({ name: 'failed_login_attempts', default: 0, type: 'int' })
    failedLoginAttempts: number;

    @Column({ name: 'last_failed_login', type: 'timestamp', nullable: true })
    lastFailedLogin: Date | null;

    @Column({ name: 'lock_until', type: 'timestamp', nullable: true })
    lockUntil: Date | null;

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
    @OneToOne(() => User, (user) => user.authSecurity, {
        onDelete: 'CASCADE', // Delete authSecurity when user is deleted
    })
    @JoinColumn({ name: 'user_id' }) // Foreign key in auth_sessions table
    user: User;

    // Methods

    /**
     * Records a failed login attempt
     * Increments counter and locks account if threshold is reached
     */
    recordFailedAttempt(ip?: string, userAgent?: string): void {
        // Increment failed attempts
        this.failedLoginAttempts += 1;
        this.lastFailedLogin = new Date();

        // Update IP and user agent if provided
        if (ip) {
            this.lastLoginIp = ip;
        }
        if (userAgent) {
            this.lastLoginUserAgent = userAgent;
        }

        // Check if account should be locked
        if (this.failedLoginAttempts >= AuthSecurity.MAX_FAILED_ATTEMPTS) {
            this.lockAccount();
        }
    }

    /**
     * Records a successful login
     * Resets failed attempts and updates login info
     */
    recordSuccessfulLogin(ip?: string, userAgent?: string, deviceInfo?: { browser?: string; os?: string; deviceType?: string }): void {
        // Reset failed attempts
        this.failedLoginAttempts = 0;
        this.lockUntil = null;
        this.lastFailedLogin = null;

        // Update login info
        this.lastLogin = new Date();

        if (ip) {
            this.lastLoginIp = ip;
            console.log('update')
        }

        if (userAgent) {
            this.lastLoginUserAgent = userAgent;
        }

        // Update device info if provided
        if (deviceInfo) {
            if (deviceInfo.browser) {
                this.browser = deviceInfo.browser;
            }
            if (deviceInfo.os) {
                this.os = deviceInfo.os;
            }
            if (deviceInfo.deviceType) {
                this.deviceType = deviceInfo.deviceType;
            }
        }
    }

    /**
     * Locks the account for the configured duration
     */
    lockAccount(): void {
        const lockDurationMs = AuthSecurity.LOCK_DURATION_MINUTES * 60 * 1000;
        this.lockUntil = new Date(Date.now() + lockDurationMs);
    }

    /**
     * Manually unlocks the account
     */
    unlockAccount(): void {
        this.failedLoginAttempts = 0;
        this.lockUntil = null;
        this.lastFailedLogin = null;
    }

    /**
     * Checks if the account is currently locked
     */
    isLocked(): boolean {
        if (!this.lockUntil) {
            return false;
        }

        // If lock has expired, auto-unlock
        if (this.lockUntil < new Date()) {
            this.unlockAccount();
            return false;
        }

        return true;
    }

    /**
     * Gets the remaining lock time in minutes
     */
    getRemainingLockTime(): number {
        if (!this.lockUntil) {
            return 0;
        }

        const now = new Date();
        if (this.lockUntil <= now) {
            return 0;
        }

        const remainingMs = this.lockUntil.getTime() - now.getTime();
        return Math.ceil(remainingMs / (60 * 1000));
    }

    /**
     * Checks if the account can attempt login
     * Returns true if not locked
     */
    canAttemptLogin(): boolean {
        return !this.isLocked();
    }

    /**
     * Gets the number of remaining attempts before lock
     */
    getRemainingAttempts(): number {
        return Math.max(0, AuthSecurity.MAX_FAILED_ATTEMPTS - this.failedLoginAttempts);
    }

    /**
     * Static method to get configuration
     */
    static getSecurityConfig() {
        return {
            maxFailedAttempts: AuthSecurity.MAX_FAILED_ATTEMPTS,
            lockDurationMinutes: AuthSecurity.LOCK_DURATION_MINUTES,
        };
    }

    /**
     * Static method to update configuration (if needed)
     */
    static updateSecurityConfig(maxAttempts?: number, lockMinutes?: number) {
        if (maxAttempts !== undefined) {
            AuthSecurity.MAX_FAILED_ATTEMPTS = maxAttempts;
        }
        if (lockMinutes !== undefined) {
            AuthSecurity.LOCK_DURATION_MINUTES = lockMinutes;
        }
    }

    // Hook to auto-unlock expired locks before update
    @BeforeUpdate()
    checkLockExpiry() {
        if (this.lockUntil && this.lockUntil < new Date()) {
            this.unlockAccount();
        }
    }
}