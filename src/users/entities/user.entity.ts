import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Password } from '../../auth/entities/password.entity';
import { AuthSession } from 'src/auth/entities/auth.entity';
import { AuthToken } from 'src/auth/entities/auth-token.entity';
@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'first_name', type: 'varchar', length: 100 })
    first_name: string;

    @Column({ name: 'last_name', type: 'varchar', length: 100 })
    last_name: string;

    @Column({ name: 'email', type: 'varchar', length: 200, unique: true })
    email: string;

    @Column({ name: 'role', type: 'varchar', length: 50, default: 'user' })
    role: string;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    // relations here
    @OneToOne(() => Password, password => password.user)
    auth: Password;

    @OneToMany(() => AuthSession, (session) => session.user)
    authSessions: AuthSession[];

    @OneToMany(() => AuthToken,
        (token) => token.user)
    authTokens: AuthToken[];

}