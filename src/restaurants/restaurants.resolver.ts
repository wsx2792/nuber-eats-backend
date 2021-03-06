import { SetMetadata } from "@nestjs/common";
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { User, UserRole } from "src/users/entities/user.entity";
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
import { RestaurantService } from "./restaurants.service";

//리졸버는 쿼리에서 특정 필드에 대한 요청이 있을 때, Service의 함수를 사용하여 불러와야할 데이터를 GraphQL에게 알려주는 역할을 맡습니다.
@Resolver(of => Restaurant)
export class RestaurantResolver{
    constructor(private readonly restaurantService: RestaurantService) {}

    @Mutation(returns => CreateRestaurantOutput)
    @Role(["Owner"])
    async createRestaurant( 
        @AuthUser() authUser:User,
        @Args('input') createRestaurantInput:CreateRestaurantInput,
         ): Promise<CreateRestaurantOutput> {
        return this.restaurantService.createRestaurant(authUser, createRestaurantInput);
    }

    @Query(returns => MyRestaurantsOutput)
    @Role(['Owner'])
    myRestaurants(@AuthUser() owner: User): Promise<MyRestaurantsOutput> {
      return this.restaurantService.myRestaurants(owner);
    }

    @Query(returns => MyRestaurantOutput)
  @Role(['Owner'])
  myRestaurant(
    @AuthUser() owner: User,
    @Args('input') myRestaurantInput: MyRestaurantInput,
  ): Promise<MyRestaurantOutput> {
    return this.restaurantService.myRestaurant(owner, myRestaurantInput);
  }

    @Mutation(returns =>EditRestaurantOutput)
    @Role(["Owner"])
    editRestaurant (
        @AuthUser() owner: User,
        @Args('input') editRestaurantInput: EditRestaurantInput
    ): Promise<EditRestaurantOutput> {
        return this.restaurantService.editRestaurant(owner, editRestaurantInput)
    }

    @Mutation(returns =>DeleteRestaurantOutput)
    @Role(["Owner"])
    deleteRestaurant(
        @AuthUser() owner: User,
        @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
    ): Promise<DeleteRestaurantOutput> {
        return this.restaurantService.deleteRestaurant(owner, deleteRestaurantInput);
    }

    @Query(returns => RestaurantsOutput)
    restaurants(@Args('input') restaurantsInput:RestaurantsInput):Promise<RestaurantsOutput> {
        return this.restaurantService.allRestaurants(restaurantsInput);
    }

    @Query(returns => RestaurantOutput)
    restaurant(@Args('input') restaurantsInput:RestaurantInput):Promise<RestaurantOutput> {
        return this.restaurantService.findRestaurantById(restaurantsInput);
    }

    @Query(returns => SearchRestaurantOutput)
    searchRestaurant(
        @Args('input') searchRestaurantInput: SearchRestaurantInput
    ):Promise<SearchRestaurantOutput> {
        return this.restaurantService.searchRestaurantByName(searchRestaurantInput);
    }
}

@Resolver(of => Category)
export class CategoryResolver {
    constructor(private readonly restaurantService: RestaurantService) {}

    @ResolveField(type => Int)
    restaurantCount(@Parent() category:Category): Promise<number> {
        return this.restaurantService.countRestaurant(category);
        
        // return 80;
    }

    @Query(type => AllCategoriesOutput)
    allCategories() :Promise<AllCategoriesOutput> {
        return this.restaurantService.allCategories();
    }

    @Query(type => CategoryOutput)
    category(@Args('input') categoryInput:CategoryInput):Promise<CategoryOutput> {
        return this.restaurantService.findCategoryBySlug(categoryInput);
    }
}

@Resolver(of => Dish)
export class DishResolver {
    constructor(private readonly restaurantService: RestaurantService) {}

    @Mutation(type => CreateDishOutput)
    @Role(['Owner'])
    createDish(
        @AuthUser() owner:User,
        @Args('input') createDishInput:CreateDishInput): Promise<CreateDishOutput> {
            return this.restaurantService.createDish(owner, createDishInput);
    }

    @Mutation(type => EditDishOutput)
    @Role(['Owner'])
    editDish(
        @AuthUser() owner:User,
        @Args('input') editDishInput:EditDishInput): Promise<EditDishOutput> {
            return this.restaurantService.editDish(owner, editDishInput);
    }

    @Mutation(type => DeleteDishOutput)
    @Role(['Owner'])
    deleteDish(
        @AuthUser() owner:User,
        @Args('input') deleteDishInput:DeleteDishInput): Promise<DeleteDishOutput> {
            return this.restaurantService.deleteDish(owner, deleteDishInput);
    }
}