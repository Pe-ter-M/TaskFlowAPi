import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';
@Entity('password')
export class Password {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid', unique: true, nullable:false })
    user_id: string;

    @Column({ name: 'user_password', type: 'varchar' })
    password: string;


    @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    // methods
    @BeforeInsert()
    async hashPasswordOnInsert() {
        await this.hashPasswordIfNeeded();
    }

    @BeforeUpdate()
    async hashPasswordOnUpdate() {
        if (this.password && !this.password.startsWith('$2b$')) {
            await this.hashPasswordIfNeeded();
        }
    }

    private async hashPasswordIfNeeded() {
        this.password = await bcrypt.hash(this.password, 10);
    }

    async validatePassword(plainPassword: string): Promise<boolean> {
        const valide_password = await bcrypt.compare(plainPassword, this.password);
        return valide_password;
    }

}
