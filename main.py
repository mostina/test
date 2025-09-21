from fastapi import FastAPI, HTTPException, Body, Query
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId
from models import Human, Item, Category
from names import people_list
from inventory import inventory_list
from dotenv import load_dotenv
from fastapi.encoders import jsonable_encoder
from loguru import logger
import os
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import ServerSelectionTimeoutError

# --- Inizializza FastAPI ---
app = FastAPI()
os.makedirs("logs", exist_ok=True)
logger.add("logs/app.log", rotation="1 MB", level="INFO", enqueue=True)
logger.info("Logger inizializzato correttamente")

# --- CORS ---
app.add_middleware( 
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:8000", "http://127.0.0.1:5173", "http://127.0.0.1:8000"],  # frontend Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Carica variabili ambiente ---
load_dotenv()
MONGO_USER = os.getenv("MONGO_USER")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
MONGO_HOST = os.getenv("MONGO_HOST")
MONGO_PORT = os.getenv("MONGO_PORT")
MONGO_DB = os.getenv("MONGO_DB")

# --- Connessione MongoDB ---
client = MongoClient(
    f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}:{MONGO_PORT}/?authSource=admin"
)
db = client[MONGO_DB]
collection = db["people"]
inventory = db["inventory"]

# --- Funzioni helper ---
def status(person: Human):
    age_status = person.checkage()
    if age_status == 0:
        return "You can't enter"
    elif age_status == 1:
        return "You can drink only one beer"
    else:
        return "You can drink more than one beer"

def insert_person(person: Human):
    doc = {
        "name": person.name,
        "age": person.age,
        "address": person.address,
        "paid": person.paid,
        "password": person.password,
        "status": status(person),
        "personalcart": []

    }
    result = collection.insert_one(doc)
    return result

def insert_inventory(item: Item):
    doc = {
        "name": item.name,
        "category": item.category.value,  # serve per filtrare
        "cost": item.cost,
        "sellingprice": item.sellingprice,
        "units": item.units,
        "availability": item.checkavailability(),
        "amountInCart": item.amountInCart,
    }
    result = inventory.insert_one(doc)
    return result

def load_initial_data():
    try:
        # Persone
        if collection.count_documents({}) == 0:
            for human in people_list:
                insert_person(Human(**human))
        # Inventory
        if inventory.count_documents({}) == 0:
            for product in inventory_list:
                insert_inventory(Item(**product))
    except ServerSelectionTimeoutError:
        logger.error("MongoDB non raggiungibile! Non è stato possibile caricare i dati iniziali.")

# --- Startup event ---
@app.on_event("startup")
def startup_event():
    load_initial_data()

@app.delete("/people/{user_id}/cart")
def clear_cart(user_id: str):
    person = collection.find_one({"_id": ObjectId(user_id)})
    if not person:
        raise HTTPException(status_code=404, detail="User not found")

    collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"personalcart": []}}
    )

    return []


# --- PEOPLE endpoints ---
@app.get("/people")
def get_people():
    people_data = []
    for doc in collection.find():
        doc["_id"] = str(doc["_id"])
        people_data.append(doc)
    return people_data

@app.get("/people/{person_id}")
def get_person(person_id: str):
    person = collection.find_one({"_id": ObjectId(person_id)})
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    # Assicura che gli item abbiano solo le proprietà usate dal frontend
    person["personalcart"] = [
        {
            "name": i["name"],
            "sellingprice": i["sellingprice"],
            "category": i.get("category", ""),
        } for i in person.get("personalcart", [])
    ]
    return person

@app.put("/inventory/item")
def edit_units(data: dict = Body(...)):
    obj_name = data.get("item_name")
    if not obj_name:
        raise HTTPException(status_code=400, detail="Missing item_name")

    obj = inventory.find_one({"name": obj_name})
    if not obj:
        raise HTTPException(status_code=404, detail="Item not found")

    # decrement units
    new_units = obj.get("units", 0) - 1
    availability = new_units > 0

    inventory.update_one({"name": obj_name}, {"$set": {
        "units": new_units,
        "availability": availability}})

    obj["units"] = new_units
    obj["availability"] = availability
    obj["_id"] = str(obj["_id"])  # <-- Convert ObjectId to string

    return jsonable_encoder(obj)


@app.post("/people")
def add_person(person: Human):
    result = insert_person(person)
    doc = collection.find_one({"_id": result.inserted_id})
    doc["_id"] = str(doc["_id"])
    return doc

@app.post("/people/cart")
def add_cart(data: dict = Body(...)):
    user_id = data.get("user_id")
    item = data.get("item")
    if not user_id or not item:
        raise HTTPException(status_code=400, detail="Missing user_id or item")
    
 
    collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"personalcart": item}}
    )
    person = collection.find_one({"_id": ObjectId(user_id)})
    return person.get("personalcart", [])

@app.delete("/people/cart")
def delete_cart_item(data: dict = Body(...)):
    user_id = data.get("user_id")
    item_id = data.get("item_id")
    if not user_id or not item_id:
        raise HTTPException(status_code=400, detail="Missing user_id or item_id")

  
    collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"personalcart": {"_id": ObjectId(item_id)}}}  # converte stringa in ObjectId
    )

    person = collection.find_one({"_id": ObjectId(user_id)})
    return person.get("personalcart", [])



@app.put("/people/{person_id}")
def update_person(person_id: str, person: Human):
    existing = collection.find_one({"_id": ObjectId(person_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Person not found")
    updated_doc = jsonable_encoder(person)
    updated_doc["status"] = status(person)
    collection.update_one({"_id": ObjectId(person_id)}, {"$set": updated_doc})
    updated_doc["_id"] = person_id
    return updated_doc

@app.patch("/people/{person_id}")
def patch_person(person_id: str, updates: dict = Body(...)):
    result = collection.update_one({"_id": ObjectId(person_id)}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Person not found")
    return {"message": f"Person with id {person_id} updated!", "updates": updates}

@app.delete("/people/{person_id}")
def delete_person(person_id: str):
    result = collection.delete_one({"_id": ObjectId(person_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Person not found")
    return {"message": f"Person with id {person_id} was deleted successfully!"}

# --- INVENTORY endpoints ---
@app.get("/inventory")
def get_inventory(category: Category = Query(..., description="Filter by category")):
    items_data = []
    for item in inventory.find({"category": category.value}):
        item["_id"] = str(item["_id"])
        items_data.append(item)
    return items_data


@app.get ("/inventory/units")
def get_units (item_id: str):

    obj = inventory.find_one({"_id":ObjectId(item_id)})
    return obj["units"]
    
    

@app.put("/editinventory/{item_id}")
def update_inventory(item_id: str, item: Item):
    existing = inventory.find_one({"_id": ObjectId(item_id)})
    if not existing:
       raise HTTPException(status_code=404, detail="Item not found")
    updated_doc = jsonable_encoder(item)
    updated_doc["availability"] = updated_doc.get("units", 0) > 0
    inventory.update_one({"_id": ObjectId(item_id)}, {"$set": updated_doc})
    updated_doc["_id"] = item_id
    return updated_doc


