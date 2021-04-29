<<<<<<< HEAD
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderService {}
=======
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Dish } from "src/restaurants/entities/dish.entity";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { CreateOrderInput, CreateOrderOutput } from "./dto/create-order.dto";
import { OrderItem } from "./entities/order-item.entity";
import { Order } from "./entities/order.entity";

 

 @Injectable()
 export class OrderService {
     constructor(
        @InjectRepository(Order)
        private readonly orders: Repository<Order>,
        @InjectRepository(OrderItem)
        private readonly orderItems: Repository<OrderItem>,
        @InjectRepository(Restaurant)
        private readonly restaurant: Repository<Restaurant>,
        @InjectRepository(Dish)
        private readonly dishes: Repository<Dish>,
     ) {}

    async createOrder(customer:User, {restaurantId, items}:CreateOrderInput): Promise<CreateOrderOutput> {
        try {
            const restaurant = await this.restaurant.findOne(restaurantId);
        if(!restaurant) {
            return {
                ok:false,
                error:"Restaurant not found",
            }
        }
        let orderFinalPrice = 0;
        const orderItems: OrderItem[] = [];
        for(const item of items) {
            const dish = await this.dishes.findOne(item.dishId);
            if(!dish) {
                //abort the whole order
                return {
                    ok:false,
                    error:"dish not found",
                }
            }
            let dishFinalPrice = dish.price;
            
            for(const itemOption of item.options) {
                const dishOption = dish.options.find( dishOption => dishOption.name === itemOption.name);
                if(dishOption) {
                    if(dishOption.extra) {
                        dishFinalPrice+=dishOption.extra;
                        console.log(`USD + ${dishOption.extra}`);
                        
                    }else {
                        const dishOptionChoice = dishOption.choices.find(optionChoice => optionChoice.name === itemOption.choice,);
                        if(dishOptionChoice) {
                            if(dishOptionChoice.extra) {
                                dishFinalPrice+=dishOptionChoice.extra;
                                console.log(`USD + ${dishOptionChoice.extra}`);
                            }
                        }
                    }
                    
                }
                
            }
            orderFinalPrice += dishFinalPrice;
            const orderItem = await this.orderItems.save(this.orderItems.create({
                dish,
                options: item.options,
            }));
            orderItems.push(orderItem);
        }
    
        const order = await this.orders.save(this.orders.create({
            customer,
            restaurant,
            total:orderFinalPrice,
            items:orderItems,
        }),);
        return {
            ok:true,
        }
        } catch (error) {
            return {
                ok: false,
                error: "Could not create order",
            }
        }
    }
}
>>>>>>> fc6bcf93de258809eedbf3449271d1da829b10d0