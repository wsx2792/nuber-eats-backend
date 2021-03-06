import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { travelSchemaPossibleExtensions } from "graphql-tools";
import { User } from "src/users/entities/user.entity";
import { Like, Raw, Repository, TreeLevelColumn } from "typeorm";
import { AllCategoriesOutput } from "./dtos/all-categories.dto";
import { CategoryInput, CategoryOutput } from "./dtos/category.dto";
import { CreateDishInput, CreateDishOutput } from "./dtos/create-dish.dto";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { DeleteDishInput, DeleteDishOutput } from "./dtos/delete-dish.dto";
import { DeleteRestaurantInput, DeleteRestaurantOutput } from "./dtos/delete-restaurant.dto";
import { EditDishInput, EditDishOutput } from "./dtos/edit-dish.dto";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/edit-restaurant.dto";
import { MyRestaurantInput, MyRestaurantOutput } from "./dtos/my-restaurant.dto";
import { MyRestaurantsOutput } from "./dtos/my-restaurants.dto";
import { RestaurantInput, RestaurantOutput } from "./dtos/restaurant.dto";
import { RestaurantsInput, RestaurantsOutput } from "./dtos/restaurants.dto";
import { SearchRestaurantInput, SearchRestaurantOutput } from "./dtos/search-restaurant.dto";
import { Category } from "./entities/category.entity";
import { Dish } from "./entities/dish.entity";
import { Restaurant } from "./entities/restaurant.entity";
import { CategoryRepository } from "./repositories/category.repository";


@Injectable()
export class RestaurantService {
    constructor(
        @InjectRepository(Restaurant)
        private readonly restaurants:Repository<Restaurant>,
        private readonly categories:CategoryRepository,
        @InjectRepository(Dish)
        private readonly dishes: Repository<Dish>,
    ) {}

    async createRestaurant(
        owner: User,
        createRestaurantInput: CreateRestaurantInput): Promise<CreateRestaurantOutput> {
        try {
            const newRestaurant = this.restaurants.create(createRestaurantInput);
            newRestaurant.owner = owner;
            const category = await this.categories.getOrCreate(createRestaurantInput.categoryName,);
            newRestaurant.category = category;

            await this.restaurants.save(newRestaurant);
            return {
                ok:true,
                restaurantId: newRestaurant.id,
            }
        } catch {
            return {
                ok: false,
                error: "Could not create restaurant.",
            };
        }
    }

    async editRestaurant(
        owner:User, 
        editRestaurantInput: EditRestaurantInput
    ): Promise<EditRestaurantOutput> {
        try {
            const restaurant = await this.restaurants.findOne(editRestaurantInput.restaurantId,);
            console.log(restaurant);
            
            if(!restaurant) {
                return {
                    ok: false,
                    error: "Restaurant not found",
                };
            }
            if(owner.id !== restaurant.ownerId) {
                return {
                    ok:false,
                    error: "You cannot edit a restaurant that you do not own",
                }
            }
            let category: Category = null;
            if(editRestaurantInput.categoryName) {
                category = await this.categories.getOrCreate(
                    editRestaurantInput.categoryName,
                );
            }
            await this.restaurants.save([{
                id:editRestaurantInput.restaurantId,
                ...editRestaurantInput,
                ...(category && { category }),
            }]);
            return {
                ok:true,
            };
        } catch (error) {
            return {
                ok:false,
                error: "error!",
            }
        }
    }

    async deleteRestaurant(owner:User, {restaurantId}:DeleteRestaurantInput,): Promise<DeleteRestaurantOutput> {
        try {
            const restaurant = await this.restaurants.findOne(restaurantId,);
            
            if(!restaurant) {
                return {
                    ok: false,
                    error: "Restaurant not found",
                };
            }
            if(owner.id !== restaurant.ownerId) {
                return {
                    ok:false,
                    error: "You cannot delete a restaurant that you do not own",
                }
            }
            await this.restaurants.delete(restaurantId);
            return {
                ok:true,
            }
        } catch (error) {
            return {
                ok: false,
                error: "Could not delete restaurant.",
            }
        }
    }

    async myRestaurants(owner: User): Promise<MyRestaurantsOutput> {
        try {
          const restaurants = await this.restaurants.find({ owner });
          return {
            restaurants,
            ok: true,
          };
        } catch {
          return {
            ok: false,
            error: 'Could not find restaurants.',
          };
        }
    }

    async myRestaurant(
        owner: User,
        { id }: MyRestaurantInput,
      ): Promise<MyRestaurantOutput> {
        try {
          const restaurant = await this.restaurants.findOne(
            { owner, id },
            { relations: ['menu', 'orders'] },
          );
          return {
            restaurant,
            ok: true,
          };
        } catch {
          return {
            ok: false,
            error: 'Could not find restaurant',
          };
        }
      }

    async allCategories(): Promise<AllCategoriesOutput> {
        try {
            const categories = await this.categories.find();
            return {
                ok: true,
                categories
            }
        } catch (error) {
            return {
                ok:false,
                error: "Could not load categories.",
            }
        }
    }

    countRestaurant(category:Category) {
        return this.restaurants.count({category});
    }

   async findCategoryBySlug({ slug, page }:CategoryInput): Promise<CategoryOutput> {
        try {
            const category = await this.categories.findOne({slug},);
            console.log(category);
            
            if(!category) {
                return {
                    ok:false,
                    error:'Category not found',
                };
            }
            const restaurants = await this.restaurants.find({
                where:{
                    category,
                },
                take:10,
                skip: (page - 1) * 10,
                order: {
                    isPromoted:'DESC',
                },
            });
            const totalResults = await this.countRestaurant(category);
            return {
                ok:true,
                category,
                totalPages: Math.ceil(totalResults / 10),
                totalResults,
            }
        } catch (error) {
            return {
                ok: false,
                error: 'Could not load category',
            }
        }
    }

    async allRestaurants({page}:RestaurantsInput):Promise<RestaurantsOutput> {
        try {
            const[results, totalResults] = await this.restaurants.findAndCount({
                skip: (page-1) * 10,
                take: 10,
                order: {
                    isPromoted:'DESC',
                },
            });
            return {
                ok:true,
                results,
                totalPages: Math.ceil(totalResults / 10),
                totalResults,
            }
        } catch (error) {
            return {
                ok:false,
                error:'Could not found restaurants',
            };
        }
    }

    async findRestaurantById({restaurantId}: RestaurantInput): Promise<RestaurantOutput> {
        try {
            const restaurant = await this.restaurants.findOne(restaurantId, {
                relations: ['menu'],
            });
            if(!restaurant) {
                return {
                    ok:false,
                    error:'Restaurant not found',
                };
            }
            return {
                ok: true,
                restaurant,
            };
        } catch (error) {
            return {
                ok: false,
                error:'Could not find restaurant',
            }
        }
    }

    async searchRestaurantByName({query, page}:SearchRestaurantInput):Promise<SearchRestaurantOutput> {
        try {
            const [restaurants, totalResults] = await this.restaurants.findAndCount({
                where: {
                    name: Raw(name => `${name} ILIKE '%${query}%'`),
                },
                skip: (page-1) * 10,
                take: 10,
            });
            return {
                ok:true,
                restaurants,
                totalResults,
                totalPages: Math.ceil(totalResults / 10),
            }
        } catch (error) {
            return {
                ok:false,
                error:'Could not search for restaurants',
            }
        }
    }

    async createDish(owner:User, createDishInput:CreateDishInput): Promise<CreateDishOutput> {
        try {
            const restaurant = await this.restaurants.findOne(createDishInput.restaurantId);
            if(!restaurant) {
                return {
                    ok:false,
                    error:'Restaurant not found',
                };
            }
            if(owner.id !== restaurant.ownerId) {
                return {
                    ok:false,
                    error: 'You can not do that.',
                }
            }
            console.log(restaurant);
            
            await this.dishes.save(
                this.dishes.create({...createDishInput, restaurant}),
            );
            
            return {
                ok:true,
            }
        } catch (error) {
            console.log(error);
            return {
                ok:false,
                error: 'Could not create dish.'
            }
        }
    }

    async editDish(owner:User, editDishInput:EditDishInput):Promise<EditDishOutput> {
        try {
            const dish = await this.dishes.findOne(editDishInput.dishId, {
                relations:['restaurant'],
            });
            if(!dish) {
                return {
                    ok:false,
                    error: "Dish not found",
                }
            }
            if(dish.restaurant.ownerId !== owner.id ) {
                return {
                    ok:false,
                    error:"You cannot do that",
                }
            }
            await this.dishes.save([{
                id:editDishInput.dishId,
                ...editDishInput,
            }]);
            return {
                ok:true,
            }
        } catch (error) {
            return {
                ok:false,
                error:"Could not delete dish",
            }
        }
    }

    async deleteDish(owner:User, {dishId}:DeleteDishInput):Promise<DeleteDishOutput> {
        try {
            const dish = await this.dishes.findOne(dishId, {
                relations:['restaurant'],
            });
            if(!dish) {
                return {
                    ok:false,
                    error: "Dish not found",
                }
            }
            if(dish.restaurant.ownerId !== owner.id ) {
                return {
                    ok:false,
                    error:"You cannot do that",
                }
            }
            await this.dishes.delete(dishId);
            return {
                ok:true,
            }
        } catch (error) {
            return {
                ok:false,
                error:"Could not delete dish",
            }
        }
    }


}