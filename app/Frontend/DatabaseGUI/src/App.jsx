import React, { useState, useEffect } from "react";
import './App.css';




function App() {
  const [people, setPeople] = useState([]);
  const [selected, setSelected] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [cart, setCart] = useState([]); // array dei prodotti
  const [nameLogin, setNameLogin] = useState("LOGIN");
  const [loginStatus, setLoginStatus] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");
  const [paid, setPaid] = useState(false);
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState(null);
  const [showPeople, setShowPeople] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDrink, setShowDrink] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showCart, setShowCart] = useState(false); // boolean per mostrare/nascondere
  const [checkAge, setCheckAge] = useState(true);
  const [checkAmountAlcoholic, setCheckAmountAlcoholic] = useState(0);
  const [checkTotal, setCheckTotal]=useState(0);
  const [activeCategory, setActiveCategory] = useState(null);
  const [inventory, setInventory] = useState({});

  const toggleMenu = () => setShowMenu(!showMenu);
  const toggleDrink = () => setShowDrink(!showDrink);
  const toggleLogin = () => setShowLogin(!showLogin);


  //per caricare dal localstorage
  useEffect(() => {
     //localStorage.clear();

    const savedId = localStorage.getItem("loggedUserId");
    const savedName = localStorage.getItem("loggedUserName");
    const saveAge = localStorage.getItem("loggedUserAge");
    const saveAmountAlcholic = localStorage.getItem("loggerUserAlcoholic"); 
    const savedTotal = localStorage.getItem("total")

    if (savedId) {
      setUserId(savedId);
      setNameLogin(savedName);
      setCheckAge(saveAge);
      setCheckAmountAlcoholic(saveAmountAlcholic);
      const savedCart = JSON.parse(localStorage.getItem("Cart") || "[]");
      setCart(Array.isArray(savedCart) ? savedCart : []); // forza array
    }
  }, []);


  // --- Toggle lista persone ---
  const togglePeople = () => {
    if (!showPeople) {
      fetch("http://127.0.0.1:8000/people")
        .then(res => res.json())
        .then(data => {
          setPeople(data);
          setShowPeople(true);
        })
        .catch(err => console.error(err));
    } else {
      setShowPeople(false);
    }
  };


  const toggleCategory = (category) => {
    setActiveCategory(activeCategory === category ? null : category);
    if (!inventory[category]) {
      fetch(`http://127.0.0.1:8000/inventory?category=${category}`)
        .then(res => res.json())
        .then(data => setInventory(prev => ({ ...prev, [category]: data })))
        .catch(err => console.error("Errore fetch inventory:", err));
    }
  }

  const selectPerson = (p) => {
    setSelected(selected && selected._id === p._id ? null : p);
    setUpdatingId(null);
    setName(p.name);
    setAge(p.age);
    setAddress(p.address);
    setPaid(p.paid);
  };

  const toggleUpdate = (p) => {
    setUpdatingId(updatingId === p._id ? null : p._id);
    setName(p.name);
    setAge(p.age);
    setAddress(p.address);
    setPaid(p.paid);
  };

  const updatePerson = () => {
    if (!updatingId) return;
    fetch(`http://127.0.0.1:8000/people/${updatingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, age: parseInt(age), address, paid, password })
    })
      .then(res => res.json())
      .then(updated => {
        setPeople(people.map(p => (p._id === updated._id ? updated : p)));
        setUpdatingId(null);
        setSelected(updated);
      });
  };

  const login = () => {

    fetch('http://127.0.0.1:8000/people/')
      .then((res) => res.json())
      .then((people) => {
        const person = people.find((p) => p.name === name);


        if (!person) {
          alert("User not found!");
          return;
        }
        const pass = people.find((p) => p.password === password);
        if (person.password !== password) {
          alert("Wrong Password");
          return;

        }
        const age = person.age;
        setCheckAge(age);
        localStorage.setItem("loggedUserAge", person.age);
        const updatedCart = person.personalcart || [];
        setCart(updatedCart);
        localStorage.setItem("Cart", JSON.stringify(updatedCart));

        localStorage.setItem("loggedUserId", person._id);
        localStorage.setItem("loggedUserName", person.name);

        let alcoholicCount = 0;
        for (const item of person.personalcart) {
          if (item.category === "Alcoholic") alcoholicCount++;
        }
        setCheckAmountAlcoholic(alcoholicCount);
        localStorage.setItem("loggedAlcoholic", alcoholicCount);
        localStorage.setItem("loggerUserAlcoholic", checkAmountAlcoholic);

        setUserId(person._id);
        setNameLogin(person.name);
        setLoginStatus(1);
        toggleLogin();




        return;


      })
  }
  const logout = () => {
    localStorage.setItem("Cart", "[]"); // reset del carrello
    localStorage.removeItem("loggedAlcoholic");
    localStorage.removeItem("loggedUserId");
    localStorage.removeItem("loggedUserName");
    localStorage.removeItem("loggedUserAge");

    setUserId(null),
      setNameLogin("LOGIN");
    toggleLogin();
    setLoginStatus(0);

  }

  const addCart  = async (item) => {
    const itemId= item._id;
     
    //qui controllo che sia loggato 
    if (!userId) return alert("You must be logged in!");


   //controllo se ho unità di quel prodotto disponibili
    const res = await fetch(`http://127.0.0.1:8000/inventory/units?item_id=${itemId}`,);
    const finalunit=await res.json();
      if(finalunit===0)
      return alert ("This item is not available");

  //qui aggiungo al conto di alcolici nel caso ho aggiunto un alcolico
    if (item.category === "Alcoholic") {
    const amountalcohol = checkAmountAlcoholic + 1;
    setCheckAmountAlcoholic(amountalcohol);
    localStorage.setItem("loggerUserAlcoholic", checkAmountAlcoholic);
  }
  
    //controllo alcol 
  if (item.category === "Alcoholic") {
    if (checkAge < 18)
      return alert("You can't order alcoholic beverages!");
    if (checkAge < 36) {
      if (checkAmountAlcoholic >0)
        return alert("You can't order other alcoholics!");
    }
  }
  //qui aggiungo al conto di alcolici nel caso ho aggiunto un alcolico
    if (item.category === "Alcoholic") {
    const amountalcohol = checkAmountAlcoholic + 1;
    setCheckAmountAlcoholic(amountalcohol);
    localStorage.setItem("loggerUserAlcoholic", checkAmountAlcoholic);
  }
    // Controlla se l'item è già nel carrello cosi invece di averlo doppio nella lista 
    //ho la quantità vicino al nome dell'item nel carrello
    const existingItem = cart.find(d => d.name === item.name);
    let updatedCart;
    if (existingItem) {
      // map per creare un nuovo array, React-friendly
      existingItem.amountInCart++;
      setCart([...cart]);
      localStorage.setItem("Cart", JSON.stringify(cart));
    } else {
      updatedCart = [...cart, { ...item, amountInCart: 1 }];
       setCart(updatedCart);
    localStorage.setItem("Cart", JSON.stringify(updatedCart));
    }
     

   //aggiunge al carrello di quella persona nel database l'elemento
    fetch("http://127.0.0.1:8000/people/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, item })})

 

  // aggiorna l'item nel DB e riceve l'oggetto aggiornato
const resp = await fetch(`http://127.0.0.1:8000/inventory/item`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ item_name: item.name })
});



// AGGIORNAMENTO CORRETTO DELL'INVENTORY
const updatedItem = await resp.json();

// DEBUG: vediamo cosa arriva dal server
console.log("Item originale:", item);
console.log("Updated item dal server:", updatedItem);

// FORZA L'AGGIORNAMENTO DELL'INVENTORY
setInventory(prev => {
  console.log("Inventory prima dell'update:", prev);
  
  // Crea una copia completamente nuova
  const newInventory = {};
  
  // Copia tutte le categorie
  Object.keys(prev).forEach(categoryKey => {
    if (categoryKey === item.category) {
      // Aggiorna la categoria corrente
      newInventory[categoryKey] = prev[categoryKey].map(inventoryItem => {
        if (inventoryItem._id === item._id) {
          const updated = {
            ...inventoryItem,
            availability: updatedItem.availability !== undefined ? updatedItem.availability : false
          };
          console.log("Aggiornando item:", inventoryItem.name, "da", inventoryItem.availability, "a", updated.availability);
          return updated;
        }
        return inventoryItem;
      });
    } else {
      // Copia le altre categorie senza modifiche
      newInventory[categoryKey] = prev[categoryKey];
    }
  });
  
 
    
  return newInventory;
});

     

};

const deleteItemFromCart = (item) => {
  fetch("http://127.0.0.1:8000/people/cart", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, item_id: item.id })
  })
    .then(res => res.json())
    .then(updatedCart => {

      setCart(Array.isArray(updatedCart) ? updatedCart : []); // forza array
      localStorage.setItem("Cart", JSON.stringify(Array.isArray(updatedCart) ? updatedCart : []));

    })
    .catch(err => console.error("Errore nello svuotare il carrello:", err));
}


const clearCart = () => {

  fetch(`http://127.0.0.1:8000/people/${userId}/cart`, {
    method: "DELETE",
  })
    .then(res => res.json())
    .then(emptyCart => {
      setCart(emptyCart); // aggiorna lo stato React
      localStorage.setItem("Cart", JSON.stringify(emptyCart)); // aggiorna localStorage
    })
    .catch(err => console.error("Errore nello svuotare il carrello:", err));
  setCheckAmountAlcoholic(0);
  setCheckTotal(0);

};



const addPerson = () => {
  if (!name || !age || !address) return alert("Fill all fields!");
  const ageNum = parseInt(age);
  if (isNaN(ageNum) || ageNum < 0) return alert("Age must be positive!");
  const newPerson = { name, age: ageNum, address, paid, password };
  fetch("http://127.0.0.1:8000/people", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newPerson)
  })
    .then(res => res.json())
    .then(inserted => {
      setPeople([...people, inserted]);
      setName(""); setAge(""); setAddress(""); setPaid(false);
      setShowAddForm(false);
    })
    .catch(err => console.error(err));
};

const deletePerson = (id) => {
  if (!window.confirm("Are you sure?")) return;
  fetch(`http://127.0.0.1:8000/people/${id}`, { method: "DELETE" })
    .then(res => res.json())
    .then(() => {
      setPeople(people.filter(p => p._id !== id));
      if (selected && selected._id === id) setSelected(null);
    });
};

return (
  <>
    <div className="topbar">
      <div className="topleft" onClick={toggleLogin}>
        {nameLogin.toUpperCase()}
      </div>

      {showLogin && (
        userId == null ? (
          <div className="login">
            Name: <input value={name} onChange={e => setName(e.target.value)} />
            Password: <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={login}>Login</button>
          </div>
        ) : (
          <div className="login">
            <button onClick={logout}>Logout</button>
          </div>
        )
      )}

      {userId && (
        <div className="topright" onClick={() => setShowCart(!showCart)}>
          CART
        </div>
      )}
    </div>

    {/* Carrello: dentro lo stesso wrapper della pagina principale */}
    {userId && showCart && (
      <div className="cartlist"> <button onClick={clearCart}>Clear Cart</button>
        {cart.length === 0 ? (
          <p>The cart is empty</p>
        ) : (
          cart.map((item, index) => (
            <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              <span>
                {item?.name ?? "Sconosciuto"} - {item?.sellingprice ?? 0}€ - {item?.amountInCart ?? 0}
              </span>
              <div className="order">
                <button className="orderfromcart" onClick={() => addCart(item)}>+</button>
                <button className="orderfromcart" onClick={() => deleteItemFromCart(item)}>-</button>
              </div>
            </div>
          ))
        )}
<li>
  Total: {cart.reduce((acc, d) => acc + d.sellingprice * (d.amountInCart || 1), 0)} €
</li>

      </div>
    )}


    <div className="column" style={{ display: "flex", flexDirection: "row", minHeight: "100vh", fontFamily: "Arial" }}>

      {/* COLONNA PEOPLE */}
      <div className="column" style={{ flex: 1, padding: "20px" }}>
        <h1>People</h1>
        <button onClick={(e) => { e.stopPropagation(); togglePeople(); }}>
          {showPeople ? "Hide" : "Get"}
        </button>

        {showPeople && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {people.map(p => (
              <li key={p._id} className="list" onClick={() => selectPerson(p)} style={{ cursor: "pointer" }}>
                <strong>{p.name}</strong>
                {selected && selected._id === p._id && (
                  <div>
                    Age: {p.age} <br />
                    Address: {p.address} <br />
                    Paid: {p.paid ? "✅" : "❌"} <br />
                    <div className="status"><strong>Status: {p.status}</strong></div><br />

                    <button className="up" onClick={(e) => { e.stopPropagation(); toggleUpdate(p); }}>Update</button>
                    <button className="cancel" onClick={(e) => { e.stopPropagation(); deletePerson(p._id); }}>Delete</button>

                    {updatingId === p._id && (
                      <div className="Update" onClick={(e) => e.stopPropagation()}>
                        <h3>Update {p.name}</h3>
                        <div>
                          <label>Name: </label>
                          <input value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div>
                          <label>Age: </label>
                          <input type="number" value={age} onChange={e => setAge(e.target.value)} />
                        </div>
                        <div>
                          <label>Address: </label>
                          <input value={address} onChange={e => setAddress(e.target.value)} />
                        </div>
                        <div>
                          <label>Paid: </label>
                          <input type="checkbox" checked={paid} onChange={e => setPaid(e.target.checked)} />
                        </div>
                        <button className="up" onClick={updatePerson}>Update</button>
                        <button className="cancel" onClick={() => setUpdatingId(null)}>Cancel</button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <button className="cancel" onClick={() => setShowAddForm(!showAddForm)} style={{ marginTop: "20px" }}>
          {showAddForm ? "Cancel" : "Add Person"}
        </button>

        {showAddForm && (
          <div className="Update">
            <h2>Add New Person</h2>
            <div>
              <label>Name: </label>
              <input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label>Age: </label>
              <input type="number" value={age} onChange={e => setAge(e.target.value)} />
            </div>
            <div>
              <label>Address: </label>
              <input value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div>
              <label>Paid: </label>
              <input type="checkbox" checked={paid} onChange={e => setPaid(e.target.checked)} />
            </div>
            <button className="up" onClick={addPerson}>Save</button>
          </div>
        )}
      </div>

      {/* COLONNA MENU */}
      <div className="column" style={{ flex: 1, padding: "20px" }}>
        <h1 onClick={toggleMenu} style={{ cursor: "pointer" }}>Menu</h1>

        {showMenu && (
          <ul>
            {/* APPETIZERS */}
            <li className="menu"> <span onClick={() => toggleCategory("Appetizers")} style={{ cursor: "pointer" }}>APPETIZERS</span>
              {activeCategory === "Appetizers" &&
                (<ul className="bevande"> {
                  inventory["Appetizers"]?.map(d => (<li className="bevande" key={d._id}> <div className="item-row">
                    <span className="item-text"> {d.name} - Price: {d.sellingprice}€ - Availability: {d.availability ? "✅" : "❌"} </span>
                    <div className="order-buttons"> <button className="order" onClick={() => addCart(d)}>+</button> <button className="order">-</button> </div>
                  </div> </li>))} </ul>)} </li>


            {/* DESSERT */}
            <li className="menu"> <span onClick={() => toggleCategory("Dessert")} style={{ cursor: "pointer" }}>DESSERT</span>
              {activeCategory === "Dessert" &&
                (<ul className="bevande"> {
                  inventory["Dessert"]?.map(d => (<li className="bevande" key={d._id}> <div className="item-row">
                    <span className="item-text"> {d.name} - Price: {d.sellingprice}€ - Availability: {d.availability ? "✅" : "❌"} </span>
                    <div className="order-buttons"> <button className="order" onClick={() => addCart(d)}>+</button> <button className="order">-</button> </div>
                  </div> </li>))} </ul>)} </li>

            {/* DRINKS */}
            <li className="menu">
              <span onClick={toggleDrink} style={{ cursor: "pointer" }}>DRINKS</span>
              {showDrink && (
                <ul className="drink">
                  <li>
                    <span onClick={() => toggleCategory("Non-Alcoholic")} style={{ cursor: "pointer" }}>Soft Drinks</span>
                    {activeCategory === "Non-Alcoholic" && (
                      <ul className="bevande">
                        {inventory["Non-Alcoholic"]?.map(d => (
                          <li className="bevande" key={d._id}> <div className="item-row">
                            <span className="item-text"> {d.name} - Price: {d.sellingprice}€ - Availability: {d.availability ? "✅" : "❌"}</span>
                            <div className="order-buttons"> <button className="order" onClick={() => addCart(d)}>+</button> </div>
                          </div> </li>
                        ))}
                      </ul>
                    )}
                  </li>
                  <li>
                    <span onClick={() => toggleCategory("Alcoholic")} style={{ cursor: "pointer" }}>Alcoholic Beverages</span>
                    {activeCategory === "Alcoholic" && (
                      <ul className="bevande">
                        {inventory["Alcoholic"]?.map(d => (
                          <li className="bevande" key={d._id}> <div className="item-row">
                            <span className="item-text"> {d.name} - Price: {d.sellingprice}€ - Availability: {d.availability ? "✅" : "❌"}</span>
                            <div className="order-buttons"> <button className="order" onClick={() => addCart(d)}>+</button> <button className="order">-</button> </div>
                          </div> </li>
                        ))}
                      </ul>
                    )}
                  </li>
                </ul>
              )}
            </li>
          </ul>
        )}
      </div>

    </div>
  </>
);
}

export default App;
