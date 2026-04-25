import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Users } from '../../user/entities/user.entity'; // Ajuste o path

@ObjectType()
@Entity('orders')
export class Order {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  txid: string;

  @Field()
  @Column({ type: 'varchar', length: 32, default: 'PENDENTE' })
  status: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 11, nullable: true })
  payer_document?: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 150, nullable: true })
  payer_name?: string;

  @Field()
  @Column({ type: 'varchar', length: 16 })
  amount: string;

  @Field()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Field()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Field()
  @Column({ type: 'mediumtext' })
  qrcodeImage: string;

  @Field()
  @Column({ type: 'varchar', length: 512 })
  copyAndPaste: string;

  // Relacionamento: Várias ordens pertencem a um usuário
  @Field(() => Users)
  @ManyToOne(() => Users, (user) => user.orders)
  @JoinColumn({ name: 'user_id' }) // Cria a coluna user_id no banco
  user: Users;
}