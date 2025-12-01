import { Column, Entity,  OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AuthSecurity } from 'src/auth/entities/auth.entity';
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
    @OneToOne(() => AuthSecurity, (session) => session.user)
    authSecurity: AuthSecurity;

}