import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
@Entity('password')
export class Password {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_password', type: 'uuid' })
    password: string;

    @Column({ name: 'user_id', type: 'uuid' })
    user_id: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    // methods
    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if(this.password && !this.password.startsWith('$2b$')) {
            this.password = await bcrypt.hash(this.password, 10);
        }
    }
    async validatePassword(plainPassword: string): Promise<boolean> {
        return await bcrypt.compare(plainPassword, this.password);
    }

    // relations here
    @OneToOne(() => User, user => user.id)
    user: User;
}
