import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Order } from '../../orders/entities/order.entity'; // Ajuste o path conforme seu projeto

@ObjectType()
@Entity()
export class Users {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Column()
  password: string;

  @Field()
  @Column()
  dica_senha: string;

  // Relacionamento: Um usuário pode ter várias ordens
  @Field(() => [Order], { nullable: true })
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}