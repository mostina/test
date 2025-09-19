from pydantic import BaseModel, Field
from enum import Enum
from typing import List

class Category(Enum):
    DESSERT = "Dessert"
    APPETIZERS = "Appetizers"
    ALCOHOLIC = "Alcoholic"
    NON_ALCOHOLIC = "Non-Alcoholic"


class Item (BaseModel):
   name: str
   cost: float
   sellingprice: float
   units: int
   category: Category
   
   def checkavailability(self): 
      if self.units > 0: 
         return True
      else:
         return False
   



class Human(BaseModel):
    name: str
    age: int
    address: str
    paid: bool
    password: str
    personalcart: List[Item] = Field(default_factory=list)

    
    
    def checkage(self):
         if self.age<18:
           return 0
         elif self.age<35:
          return 1
         else:
          return 2








    