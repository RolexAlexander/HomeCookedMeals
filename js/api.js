// js/api.js

// --- Polyfill for URLSearchParams (needed for parsing query strings easily) ---
// Basic polyfill if needed, modern browsers support it
(function (w) {
    w.URLSearchParams = w.URLSearchParams || function (searchString) {
        var self = this;
        self.searchString = searchString;
        self.get = function (name) {
            var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(self.searchString);
            if (results == null) {
                return null;
            }
            else {
                // Handle cases where value might be empty string
                const value = decodeURIComponent(results[1].replace(/\+/g, " "));
                return value === "" ? "" : value || null; // Return empty string if it was empty
            }
        };
         self.getAll = function(name) {
            var results = [];
            var pattern = new RegExp('[\?&]' + name + '=([^&#]*)', 'g');
            var match;
            while ((match = pattern.exec(self.searchString)) !== null) {
                 results.push(decodeURIComponent(match[1].replace(/\+/g, " ")));
            }
            return results;
         };
         self.toString = function() {
             // Ensure leading '?' is removed if present
             return self.searchString.startsWith('?') ? self.searchString.substring(1) : self.searchString;
         };
         // Add other methods if needed (has, set, append, delete, etc.)
         // Note: A full polyfill is more complex. This covers basic 'get' and 'getAll'.
         self.append = function(name, value) {
            const separator = self.searchString.includes('?') ? '&' : '?';
            self.searchString += `${separator}${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
         };
         // Add more methods like set, delete, has as needed for full polyfill compliance
    }

    // Helper to create URLSearchParams from an object
    w.createUrlSearchParams = function(params) {
        // Ensure URLSearchParams constructor (native or polyfill) exists before using it
        if (typeof URLSearchParams === 'undefined' && typeof w.URLSearchParams === 'undefined') {
             console.error("URLSearchParams is not defined and polyfill failed to initialize.");
             // Return a dummy object or throw an error, depending on desired handling
             return { get: () => null, getAll: () => [], toString: () => '' }; // Dummy object
        }

        // Use the available constructor (prefer native)
        const SearchParamsClass = w.URLSearchParams || URLSearchParams;
        const searchParams = new SearchParamsClass();

        if (params) {
            for (const key in params) {
                // Use hasOwnProperty to avoid iterating over prototype properties
                if (Object.hasOwnProperty.call(params, key)) {
                    const value = params[key];
                    if (Array.isArray(value)) {
                        value.forEach(v => {
                            // Check if the append method exists before calling
                            if (typeof searchParams.append === 'function') {
                                searchParams.append(key, v);
                            } else {
                                // Handle polyfill case if append wasn't added
                                console.warn("URLSearchParams polyfill missing 'append'. Manually adding.");
                                const separator = searchParams.toString() ? '&' : '';
                                searchParams.searchString += `${separator}${encodeURIComponent(key)}=${encodeURIComponent(v)}`;
                            }
                        });
                    } else if (value !== undefined && value !== null) {
                        if (typeof searchParams.append === 'function') {
                             searchParams.append(key, value);
                        } else {
                             console.warn("URLSearchParams polyfill missing 'append'. Manually adding.");
                             const separator = searchParams.toString() ? '&' : '';
                             searchParams.searchString += `${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
                        }
                    }
                }
            }
        }
        return searchParams;
    }
})(window);


// --- API Simulation Module ---
const Api = (() => {

    // --- Constants for localStorage keys ---
    const MEALS_KEY = 'api_meals';
    const CATEGORIES_KEY = 'api_categories';
    const USERS_KEY = 'api_users';
    const APPOINTMENTS_KEY = 'api_appointments';
    const ORDERS_KEY = 'api_orders';
    const SUBSCRIPTIONS_KEY = 'api_subscriptions';
    const CART_KEY = 'cart'; // Client-side cart
    const AUTH_TOKEN_KEY = 'api_auth_token'; // Simulate token storage

    // --- Initial Default Data (Global Variables within IIFE scope) ---
    // These are used ONLY to seed localStorage if it's empty.
    // All runtime operations read/write from localStorage.

    const initialCategories = [
      { id: 'cat_special', name: "Chef's Specials", description: "Unique creations and limited-time offers from our chef." },
      { id: 'cat_today', name: "Taste of the Day", description: "Featured dishes highlighting today's freshest ingredients." },
      { id: 'cat_main', name: "Main Courses", description: "Hearty and satisfying main dishes." },
      { id: 'cat_appetizer', name: "Appetizers", description: "Perfect starters to whet your appetite." },
      { id: 'cat_dessert', name: "Desserts", description: "Sweet endings to your meal." },
      { id: 'cat_vegan', name: "Vegan Options", description: "Delicious plant-based meals." }
    ];

    const initialMeals = [
      { id: 'm_spec_01', name: "Lobster Thermidor", categoryId: 'cat_special', price: 4500, description: "A classic French dish of creamy lobster meat baked in its shell.", imageUrl: "https://cdn.pixabay.com/photo/2021/01/16/09/05/meal-5921491_1280.jpg", isFeatured: true },
      { id: 'm_today_01', name: "Pan-Seared Salmon", categoryId: 'cat_today', price: 2900, description: "Crispy skin salmon served with roasted asparagus and lemon-dill sauce.", imageUrl: "https://iconiclife.com/wp-content/uploads/2020/04/home-cooked-food-delivery-service-by-Matha-and-Marley.jpeg", isFeatured: true },
      { id: 'm_main_01', name: "Classic Beef Burger", categoryId: 'cat_special', price: 1800, description: "Juicy beef patty with lettuce, tomato, onion, and cheese on a brioche bun.", imageUrl: "https://img.hellofresh.com/w_3840,q_auto,f_auto,c_limit,fl_lossy/hellofresh_website/us/lp/meals/Pescatarian-meal-ginger-turmeric-tilapia-082019.jpg", isFeatured: false },
      { id: 'm_main_02', name: "Chicken Alfredo Pasta", categoryId: 'cat_special', price: 2400, description: "Creamy Alfredo sauce with grilled chicken breast over fettuccine.", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80", isFeatured: false },
      { id: 'm_app_01', name: "Bruschetta Trio", categoryId: 'cat_today', price: 1300, description: "Toasted bread with classic tomato-basil, mushroom-garlic, and olive tapenade toppings.", imageUrl: "https://veganonboard.com/wp-content/uploads/2022/11/vegan-lentil-shepherds-pie-17-500x375.jpg", isFeatured: false },
      { id: 'm_dessert_01', name: "Chocolate Lava Cake", categoryId: 'cat_today', price: 1100, description: "Warm chocolate cake with a gooey molten center, served with vanilla ice cream.", imageUrl: "https://www.melskitchencafe.com/wp-content/uploads/2023/02/creamy-garlic-shrimp-pasta11.jpg", isFeatured: true },
      { id: 'm_vegan_01', name: "Lentil Shepherd's Pie", categoryId: 'cat_today', price: 2100, description: "Hearty lentils and vegetables topped with mashed sweet potato.", imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80", isFeatured: false },
      { id: 'm_today_02', name: "Spicy Tuna Roll", categoryId: 'cat_today', price: 1600, description: "Fresh tuna mixed with spicy mayo, cucumber, and avocado.", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMLnfREQY7d9ndEwd0dwVES4GZumeKknYIUA&s", isFeatured: false },
      { id: 'm_spec_02', name: "Wagyu Steak (8oz)", categoryId: 'cat_special', price: 6500, description: "Premium Japanese Wagyu, grilled to perfection, served with truffle fries.", imageUrl: "https://cdn.pixabay.com/photo/2021/01/16/09/05/meal-5921491_1280.jpg", isFeatured: false }
    ];

    const initialSubscriptions = [
        "test@example.com", // Example initial subscriber
        // Add more initial emails if needed
    ];

    // --- Helper Functions ---
    const _getData = (key) => {
        try {
            const data = localStorage.getItem(key);
            const listKeys = [MEALS_KEY, CATEGORIES_KEY, USERS_KEY, APPOINTMENTS_KEY, ORDERS_KEY, SUBSCRIPTIONS_KEY, CART_KEY];
            if (listKeys.includes(key)) {
                // Ensure it's valid JSON array, otherwise return empty array
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        return Array.isArray(parsed) ? parsed : [];
                    } catch (parseError) {
                        console.error(`Error parsing localStorage key "${key}" as JSON array:`, parseError);
                        return [];
                    }
                } else {
                    return []; // Not found, return empty array
                }
            }
            // For non-list keys (like token)
            if (data) {
                 try {
                     // Allow parsing of non-array JSON (like token string if stored as JSON)
                     return JSON.parse(data);
                 } catch (parseError) {
                     // If it's not JSON (e.g., plain string token), return as is
                     if (key === AUTH_TOKEN_KEY && typeof data === 'string') return data;
                     console.error(`Error parsing localStorage key "${key}":`, parseError);
                     return null;
                 }
            }
            return null; // Not found, return null
        } catch (e) {
            // Catch potential localStorage access errors (e.g., security settings)
            console.error(`Error reading localStorage key "${key}":`, e);
            const listKeys = [MEALS_KEY, CATEGORIES_KEY, USERS_KEY, APPOINTMENTS_KEY, ORDERS_KEY, SUBSCRIPTIONS_KEY, CART_KEY];
            return listKeys.includes(key) ? [] : null;
        }
    };


    const _setData = (key, data) => {
        try {
            // Only stringify if data is not already a string (prevents double-stringifying tokens)
            const dataToStore = (typeof data === 'string') ? data : JSON.stringify(data);
            localStorage.setItem(key, dataToStore);
            // console.log(`Data saved to localStorage for key: ${key}`); // Log can be verbose, enable if needed
            return true;
        } catch (e) {
            console.error(`Error writing localStorage key "${key}":`, e);
            if (e.name === 'QuotaExceededError') {
                console.error("LocalStorage quota exceeded! Cannot save data.");
                alert("Error: Storage limit reached. Cannot save changes.");
            }
            return false;
        }
    };

    const _generateId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // --- Initial Data Setup ---
    const initializeData = () => {
        console.log("Initializing API data store...");

        // Seed Categories if not present
        if (localStorage.getItem(CATEGORIES_KEY) === null) {
            console.log(`LocalStorage key "${CATEGORIES_KEY}" not found. Seeding with initial data.`);
            _setData(CATEGORIES_KEY, initialCategories);
        } else {
            console.log(`LocalStorage key "${CATEGORIES_KEY}" found. Using existing data.`);
             // Optional: Validate existing data format here if needed
             const existingCategories = _getData(CATEGORIES_KEY);
             if (!Array.isArray(existingCategories)) {
                 console.warn(`LocalStorage key "${CATEGORIES_KEY}" contained invalid data. Overwriting with initial data.`);
                 _setData(CATEGORIES_KEY, initialCategories);
             }
        }

        // Seed Meals if not present
        if (localStorage.getItem(MEALS_KEY) === null) {
            console.log(`LocalStorage key "${MEALS_KEY}" not found. Seeding with initial data.`);
            _setData(MEALS_KEY, initialMeals);
        } else {
             console.log(`LocalStorage key "${MEALS_KEY}" found. Using existing data.`);
             const existingMeals = _getData(MEALS_KEY);
             if (!Array.isArray(existingMeals)) {
                 console.warn(`LocalStorage key "${MEALS_KEY}" contained invalid data. Overwriting with initial data.`);
                 _setData(MEALS_KEY, initialMeals);
             }
        }

         // Seed Subscriptions if not present
         if (localStorage.getItem(SUBSCRIPTIONS_KEY) === null) {
            console.log(`LocalStorage key "${SUBSCRIPTIONS_KEY}" not found. Seeding with initial data.`);
             _setData(SUBSCRIPTIONS_KEY, initialSubscriptions);
         } else {
              console.log(`LocalStorage key "${SUBSCRIPTIONS_KEY}" found. Using existing data.`);
              const existingSubs = _getData(SUBSCRIPTIONS_KEY);
              if (!Array.isArray(existingSubs)) {
                  console.warn(`LocalStorage key "${SUBSCRIPTIONS_KEY}" contained invalid data. Overwriting with initial data.`);
                  _setData(SUBSCRIPTIONS_KEY, initialSubscriptions);
              }
         }

         // Initialize other keys to empty arrays if they don't exist or are invalid
         const keysToEnsureArray = [USERS_KEY, APPOINTMENTS_KEY, ORDERS_KEY, CART_KEY];
         keysToEnsureArray.forEach(key => {
             if (localStorage.getItem(key) === null) {
                 // console.log(`LocalStorage key "${key}" not found. Initializing as empty array.`);
                 _setData(key, []);
             } else {
                 // Check if existing data is actually an array
                 const existingData = _getData(key);
                 if (!Array.isArray(existingData)) {
                     console.warn(`LocalStorage key "${key}" contained invalid data. Resetting to empty array.`);
                     _setData(key, []);
                 }
             }
         });

         console.log("API data store initialization complete.");
    };

    // --- Authentication Simulation ---
    const _getAuthToken = () => {
        // Retrieve potentially plain string token
        return localStorage.getItem(AUTH_TOKEN_KEY);
    };
    const _setAuthToken = (token) => {
        // Store as plain string
        _setData(AUTH_TOKEN_KEY, token);
    };
    const _clearAuthToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);
    const _validateToken = (token) => {
        // Basic check: exists and starts with 'simulated-'
        return typeof token === 'string' && token.startsWith('simulated-');
    };
     const _getUserIdFromToken = (token) => {
         if (_validateToken(token)) {
            const parts = token.split('-'); // Format: simulated-{userId}-{timestamp}
            return parts.length > 1 ? parts[1] : null; // Get the second part (userId)
         }
         return null;
     };

    // --- Authorization Helper ---
     const _requireAuth = (headers) => {
        // Prioritize Authorization header, fallback to localStorage token
        let token = headers?.Authorization?.startsWith('Bearer ')
            ? headers.Authorization.substring(7) // Remove 'Bearer ' prefix
            : _getAuthToken();

        if (!_validateToken(token)) {
            return { authorized: false, error: { status: 401, body: { success: false, message: 'Unauthorized: Authentication token missing or invalid.' } } };
        }
        const userId = _getUserIdFromToken(token);
        if (!userId) {
            // Token format might be wrong or user ID extraction failed
             return { authorized: false, error: { status: 401, body: { success: false, message: 'Unauthorized: Could not extract user ID from token.' } } };
        }

        // Optional: Verify user exists in the current user list
        const users = _getData(USERS_KEY);
        if (!users.some(u => u.id === userId)) {
             console.warn(`User ID ${userId} from token not found in user list. Invalidating token.`);
             _clearAuthToken(); // Clear the potentially stale token
             return { authorized: false, error: { status: 401, body: { success: false, message: 'Unauthorized: User associated with token not found. Token cleared.' } } };
        }

        // If all checks pass
        return { authorized: true, userId: userId, token: token };
    }

    // --- API Endpoint Handlers ---
    // All handlers use _getData and _setData to interact with localStorage.

    // == MEALS ==
    const handleGetMeals = (params) => {
        const meals = _getData(MEALS_KEY);
        const mealId = params.get('id');
        const categoryId = params.get('categoryId');
        const featured = params.get('featured');

        if (mealId) {
            const meal = meals.find(m => m.id === mealId);
            return meal ? { status: 200, body: meal } : { status: 404, body: { success: false, message: 'Meal not found' } };
        }
        let filteredMeals = meals;
        if (categoryId) {
            filteredMeals = filteredMeals.filter(m => m.categoryId === categoryId);
        }
        // Handle boolean 'featured' param correctly
        if (featured !== null) {
             const isFeatured = featured.toLowerCase() === 'true';
             filteredMeals = filteredMeals.filter(m => m.isFeatured === isFeatured);
        }

        return { status: 200, body: filteredMeals };
    };

    const handleGetFeaturedMeals = () => {
         const meals = _getData(MEALS_KEY);
         const featured = meals.filter(m => m.isFeatured === true);
         return { status: 200, body: featured };
    };

    const handlePostMeals = (body) => {
        // Add Auth check? Typically admin-only - not implemented here for simplicity
        if (!body || !body.name || !body.price || !body.description || !body.imageUrl) {
            return { status: 400, body: { success: false, message: 'Missing required meal fields (name, price, description, imageUrl)' } };
        }
        const meals = _getData(MEALS_KEY);
        const newMeal = {
            id: _generateId('m'),
            name: body.name,
            categoryId: body.categoryId || null, // Allow optional category
            price: Number(body.price) || 0, // Ensure price is a number
            description: body.description,
            imageUrl: body.imageUrl,
            isFeatured: body.isFeatured === true || body.isFeatured === 'true', // Handle boolean/string true
            createdAt: new Date().toISOString()
        };
        meals.push(newMeal);
        if (_setData(MEALS_KEY, meals)) {
            return { status: 201, body: { success: true, meal: newMeal } };
        } else {
            return { status: 500, body: { success: false, message: 'Failed to save meal data.' } };
        }
    };

    const handlePutMeals = (body) => {
        // Add Auth check?
        if (!body || !body.id) {
            return { status: 400, body: { success: false, message: 'Meal ID is required for update' } };
        }
        const meals = _getData(MEALS_KEY);
        const index = meals.findIndex(m => m.id === body.id);
        if (index === -1) {
            return { status: 404, body: { success: false, message: 'Meal not found' } };
        }
        const updatedMeal = { ...meals[index] }; // Copy existing

        // Update only provided fields
        if (body.hasOwnProperty('name')) updatedMeal.name = body.name;
        if (body.hasOwnProperty('categoryId')) updatedMeal.categoryId = body.categoryId; // Allows setting to null
        if (body.hasOwnProperty('price')) updatedMeal.price = Number(body.price) || updatedMeal.price; // Keep old price if new is invalid
        if (body.hasOwnProperty('description')) updatedMeal.description = body.description;
        if (body.hasOwnProperty('imageUrl')) updatedMeal.imageUrl = body.imageUrl;
        if (body.hasOwnProperty('isFeatured')) updatedMeal.isFeatured = body.isFeatured === true || body.isFeatured === 'true';
        updatedMeal.updatedAt = new Date().toISOString();

        meals[index] = updatedMeal;
        if(_setData(MEALS_KEY, meals)) {
            return { status: 200, body: { success: true, meal: updatedMeal } };
        } else {
             return { status: 500, body: { success: false, message: 'Failed to save updated meal data.' } };
        }
    };

    const handleDeleteMeals = (params) => {
        // Add Auth check?
        const mealId = params.get('id');
        if (!mealId) {
            return { status: 400, body: { success: false, message: 'Meal ID query parameter is required for delete' } };
        }
        const meals = _getData(MEALS_KEY);
        const initialLength = meals.length;
        const filteredMeals = meals.filter(m => m.id !== mealId);
        if (filteredMeals.length === initialLength) {
            return { status: 404, body: { success: false, message: 'Meal not found' } };
        }
        if(_setData(MEALS_KEY, filteredMeals)) {
            // Also remove from active carts
            const cart = _getData(CART_KEY);
            const updatedCart = cart.filter(item => item.mealId !== mealId);
            if (cart.length !== updatedCart.length) {
                console.log(`Removed meal ${mealId} from cart.`);
                _setData(CART_KEY, updatedCart);
            }
            return { status: 200, body: { success: true, message: 'Meal deleted successfully.' } };
        } else {
            return { status: 500, body: { success: false, message: 'Failed to save data after deleting meal.' } };
        }
    };

    // == CATEGORIES ==
     const handleGetCategories = (params) => {
        const categories = _getData(CATEGORIES_KEY);
        const catId = params.get('id');
         if (catId) {
             const category = categories.find(c => c.id === catId);
             return category ? { status: 200, body: category } : { status: 404, body: { success: false, message: 'Category not found' } };
         }
         return { status: 200, body: categories };
     };

     const handlePostCategories = (body) => {
         // Auth Check?
         if (!body || !body.name) {
             return { status: 400, body: { success: false, message: 'Category name is required' } };
         }
         const categories = _getData(CATEGORIES_KEY);
         if (categories.some(c => c.name.toLowerCase() === body.name.toLowerCase())) {
              return { status: 409, body: { success: false, message: 'Conflict: Category name already exists' } };
         }
         const newCategory = {
             id: _generateId('cat'),
             name: body.name,
             description: body.description || '',
             createdAt: new Date().toISOString()
         };
         categories.push(newCategory);
         if(_setData(CATEGORIES_KEY, categories)) {
            return { status: 201, body: { success: true, category: newCategory } };
         } else {
            return { status: 500, body: { success: false, message: 'Failed to save category data.' } };
         }
     };

    const handlePutCategories = (body) => {
        // Auth Check?
         if (!body || !body.id) {
            return { status: 400, body: { success: false, message: 'Category ID is required for update' } };
         }
         const categories = _getData(CATEGORIES_KEY);
         const index = categories.findIndex(c => c.id === body.id);
         if (index === -1) {
             return { status: 404, body: { success: false, message: 'Category not found' } };
         }
         const updatedCategory = { ...categories[index] };

         if (body.hasOwnProperty('name') && body.name !== updatedCategory.name) {
            if (categories.some(c => c.id !== body.id && c.name.toLowerCase() === body.name.toLowerCase())) {
                return { status: 409, body: { success: false, message: 'Conflict: Another category with this name already exists' } };
            }
            updatedCategory.name = body.name;
         }
         if (body.hasOwnProperty('description')) {
             updatedCategory.description = body.description;
         }
         updatedCategory.updatedAt = new Date().toISOString();

         categories[index] = updatedCategory;
         if(_setData(CATEGORIES_KEY, categories)) {
            return { status: 200, body: { success: true, category: updatedCategory } };
         } else {
            return { status: 500, body: { success: false, message: 'Failed to save updated category data.' } };
         }
     };

    const handleDeleteCategories = (params) => {
        // Auth Check?
         const catId = params.get('id');
         if (!catId) {
             return { status: 400, body: { success: false, message: 'Category ID query parameter is required for delete' } };
         }
         const categories = _getData(CATEGORIES_KEY);
         const initialLength = categories.length;
         const filteredCategories = categories.filter(c => c.id !== catId);
         if (filteredCategories.length === initialLength) {
             return { status: 404, body: { success: false, message: 'Category not found' } };
         }

         if(!_setData(CATEGORIES_KEY, filteredCategories)) {
             return { status: 500, body: { success: false, message: 'Failed to save categories after deletion.'}};
         }

         // Unset categoryId for associated meals
         const meals = _getData(MEALS_KEY);
         let mealsUpdated = false;
         const updatedMeals = meals.map(m => {
             if (m.categoryId === catId) {
                 mealsUpdated = true;
                 return { ...m, categoryId: null, updatedAt: new Date().toISOString() }; // Update timestamp
             }
             return m;
         });
         if (mealsUpdated) {
             console.log(`Unlinked meals from deleted category ${catId}.`);
             _setData(MEALS_KEY, updatedMeals); // Save updated meals
         }

         return { status: 200, body: { success: true, message: 'Category deleted and meals unlinked.' } };
     };

     // == MEALS IN CATEGORY ==
     const handleGetMealsInCategory = (categoryId) => {
         const meals = _getData(MEALS_KEY);
         const categories = _getData(CATEGORIES_KEY);
         if (!categories.some(c => c.id === categoryId)) {
             return { status: 404, body: { success: false, message: 'Category not found' } };
         }
         const filteredMeals = meals.filter(m => m.categoryId === categoryId);
         return { status: 200, body: filteredMeals };
     };

     const handleAddMealToCategory = (categoryId, body) => {
          // Auth Check?
          if (!body || !body.mealId) {
              return { status: 400, body: { success: false, message: 'Meal ID is required in body' } };
          }
          const meals = _getData(MEALS_KEY);
          const categories = _getData(CATEGORIES_KEY);
          const mealIndex = meals.findIndex(m => m.id === body.mealId);
          if (mealIndex === -1) {
              return { status: 404, body: { success: false, message: 'Meal not found' } };
          }
           if (!categories.some(c => c.id === categoryId)) {
             return { status: 404, body: { success: false, message: 'Category not found' } };
           }
          meals[mealIndex].categoryId = categoryId;
          meals[mealIndex].updatedAt = new Date().toISOString();
          if(_setData(MEALS_KEY, meals)){
              return { status: 200, body: { success: true, message: `Meal ${body.mealId} assigned to category ${categoryId}` } };
          } else {
             return { status: 500, body: { success: false, message: 'Failed to save meal data.' } };
          }
     };

      const handleRemoveMealFromCategory = (categoryId, params) => {
          // Auth Check?
          const mealId = params.get('mealId');
           if (!mealId) {
              return { status: 400, body: { success: false, message: 'mealId query parameter is required' } };
          }
          const meals = _getData(MEALS_KEY);
          const mealIndex = meals.findIndex(m => m.id === mealId);
          if (mealIndex === -1) {
              return { status: 404, body: { success: false, message: 'Meal not found' } };
          }
          if (meals[mealIndex].categoryId !== categoryId) {
              // Meal exists but isn't in this category, maybe return 200 OK or 400? Let's go with 200/message.
              return { status: 200, body: { success: true, message: `Meal ${mealId} was not in category ${categoryId}. No changes made.`}};
          }
          meals[mealIndex].categoryId = null; // Unset category
          meals[mealIndex].updatedAt = new Date().toISOString();
          if(_setData(MEALS_KEY, meals)) {
            return { status: 200, body: { success: true, message: `Meal ${mealId} removed from category ${categoryId}` } };
          } else {
            return { status: 500, body: { success: false, message: 'Failed to save meal data.' } };
          }
      };

    // == APPOINTMENTS ==
    const handleGetAppointments = (params, headers) => {
        const auth = _requireAuth(headers);
        if (!auth.authorized) return auth.error;

        const appointments = _getData(APPOINTMENTS_KEY);
        const appointmentId = params.get('id');
        const userAppointments = appointments.filter(app => app.userId === auth.userId);

        if (appointmentId) {
            const appointment = userAppointments.find(app => app.id === appointmentId);
            return appointment ? { status: 200, body: appointment } : { status: 404, body: { success: false, message: 'Appointment not found or does not belong to user' } };
        }
        // Return user's appointments, newest first
        userAppointments.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
        return { status: 200, body: userAppointments };
    };

    const handlePostAppointments = (body, headers) => {
        const auth = _requireAuth(headers);
        if (!auth.authorized) return auth.error;

        if (!body || !body.dateTime || !body.service) {
            return { status: 400, body: { success: false, message: 'Missing required appointment fields (dateTime, service)' } };
        }

        let appointmentDateTime;
        try {
            appointmentDateTime = new Date(body.dateTime);
             if (isNaN(appointmentDateTime.getTime())) throw new Error("Invalid date"); // Check if date is valid
        } catch (e) {
             return { status: 400, body: { success: false, message: 'Invalid dateTime format. Please use ISO 8601 format (e.g., YYYY-MM-DDTHH:mm).' } };
        }

        if (appointmentDateTime < new Date()) {
            return { status: 400, body: { success: false, message: 'Appointment date must be in the future.'}};
        }

        const appointments = _getData(APPOINTMENTS_KEY);
        const newAppointment = {
            id: _generateId('apt'),
            userId: auth.userId,
            dateTime: appointmentDateTime.toISOString(),
            service: body.service,
            notes: body.notes || '',
            status: 'scheduled', // e.g., scheduled, completed, cancelled
            createdAt: new Date().toISOString()
        };

        appointments.push(newAppointment);
        if (_setData(APPOINTMENTS_KEY, appointments)) {
            return { status: 201, body: { success: true, appointment: newAppointment } };
        } else {
            return { status: 500, body: { success: false, message: 'Failed to save appointment data.' } };
        }
    };

    const handlePutAppointments = (body, headers) => {
         const auth = _requireAuth(headers);
         if (!auth.authorized) return auth.error;

         if (!body || !body.id) {
            return { status: 400, body: { success: false, message: 'Appointment ID is required for update' } };
         }

         const appointments = _getData(APPOINTMENTS_KEY);
         const index = appointments.findIndex(app => app.id === body.id);

         if (index === -1) {
             return { status: 404, body: { success: false, message: 'Appointment not found' } };
         }
         const existingAppointment = appointments[index];

         if (existingAppointment.userId !== auth.userId) {
              return { status: 403, body: { success: false, message: 'Forbidden: You can only modify your own appointments.' } };
         }

         // Prevent modifying past appointments (optional rule)
         if (new Date(existingAppointment.dateTime) < new Date() && existingAppointment.status !== 'cancelled') {
             // Allow changing status of past appointments (e.g. to completed), but not date/service?
             // Let's allow status change but prevent date/service change for past ones for now.
              if (body.hasOwnProperty('dateTime') || body.hasOwnProperty('service') || body.hasOwnProperty('notes')) {
                  return { status: 400, body: { success: false, message: 'Cannot modify date, service, or notes of past appointments.' } };
              }
         }

         const updatedAppointment = { ...existingAppointment };
         let changed = false;

         if (body.hasOwnProperty('dateTime') && body.dateTime !== existingAppointment.dateTime) {
             try {
                 const newDateTime = new Date(body.dateTime);
                 if (isNaN(newDateTime.getTime())) throw new Error("Invalid date");
                 // Check if new date is in the past ONLY IF the original wasn't already past
                 if (new Date(existingAppointment.dateTime) >= new Date() && newDateTime < new Date()) {
                    return { status: 400, body: { success: false, message: 'New appointment date must be in the future.'}};
                 }
                 updatedAppointment.dateTime = newDateTime.toISOString();
                 changed = true;
             } catch(e) {
                 return { status: 400, body: { success: false, message: 'Invalid dateTime format.' } };
             }
         }
         if (body.hasOwnProperty('service') && body.service !== existingAppointment.service) {
             updatedAppointment.service = body.service; changed = true;
         }
         if (body.hasOwnProperty('notes') && body.notes !== existingAppointment.notes) {
             updatedAppointment.notes = body.notes; changed = true;
         }
         // Validate status changes? (e.g., only allow specific transitions)
         const allowedStatuses = ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no-show']; // Example statuses
         if (body.hasOwnProperty('status') && body.status !== existingAppointment.status) {
             if (!allowedStatuses.includes(body.status.toLowerCase())) {
                 return { status: 400, body: { success: false, message: `Invalid status '${body.status}'. Allowed: ${allowedStatuses.join(', ')}` } };
             }
             // Add logic for allowed transitions if needed (e.g., cannot go from 'completed' back to 'scheduled')
             updatedAppointment.status = body.status.toLowerCase();
             changed = true;
         }

         if (!changed) {
            return { status: 200, body: { success: true, message: "No changes detected.", appointment: existingAppointment }};
         }

         updatedAppointment.updatedAt = new Date().toISOString();
         appointments[index] = updatedAppointment;

         if (_setData(APPOINTMENTS_KEY, appointments)) {
             return { status: 200, body: { success: true, appointment: updatedAppointment } };
         } else {
             return { status: 500, body: { success: false, message: 'Failed to save updated appointment data.' } };
         }
    };

    const handleDeleteAppointments = (params, headers) => {
        const auth = _requireAuth(headers);
        if (!auth.authorized) return auth.error;

        const appointmentId = params.get('id');
        if (!appointmentId) {
            return { status: 400, body: { success: false, message: 'Appointment ID query parameter is required for delete' } };
        }

        const appointments = _getData(APPOINTMENTS_KEY);
        let appointmentToDelete = null;
        const indexToDelete = appointments.findIndex(app => {
             if (app.id === appointmentId) {
                 appointmentToDelete = app;
                 return true; // Found it
             }
             return false;
         });

        if (indexToDelete === -1 || !appointmentToDelete) {
            return { status: 404, body: { success: false, message: 'Appointment not found' } };
        }

        if (appointmentToDelete.userId !== auth.userId) {
             return { status: 403, body: { success: false, message: 'Forbidden: You can only delete your own appointments.' } };
        }

         // Optional: Prevent deletion of past/completed appointments?
         // if (new Date(appointmentToDelete.dateTime) < new Date() || ['completed', 'no-show'].includes(appointmentToDelete.status)) {
         //     return { status: 400, body: { success: false, message: 'Cannot delete past or completed/no-show appointments. Consider cancelling instead.' } };
         // }
         // Alternative: Allow deletion but maybe log it differently? For mock, just delete.

        const filteredAppointments = appointments.filter((app, index) => index !== indexToDelete);

        if (_setData(APPOINTMENTS_KEY, filteredAppointments)) {
            return { status: 200, body: { success: true, message: 'Appointment deleted successfully.' } };
        } else {
            return { status: 500, body: { success: false, message: 'Failed to save data after deleting appointment.' } };
        }
    };


    // == CART (Client-side functions - use localStorage via _getData/_setData) ==
    const getCart = () => {
        const cart = _getData(CART_KEY);
        const meals = _getData(MEALS_KEY); // Need meal details

        let cartNeedsUpdate = false;
        const enrichedCart = cart
            .map(item => {
                const meal = meals.find(m => m.id === item.mealId);
                if (!meal) {
                    console.warn(`Meal ID ${item.mealId} in cart not found in meals data. Removing from cart.`);
                    cartNeedsUpdate = true;
                    return null; // Mark for removal
                }
                // Ensure quantity is a positive number
                const quantity = Math.max(1, Number(item.qty) || 1);
                if (quantity !== item.qty) {
                    console.warn(`Invalid quantity ${item.qty} for meal ${item.mealId} in cart. Corrected to ${quantity}.`);
                    item.qty = quantity; // Correct in place for potential update
                    cartNeedsUpdate = true;
                }
                return {
                    mealId: item.mealId,
                    qty: quantity,
                    name: meal.name,
                    price: meal.price,
                    imageUrl: meal.imageUrl
                };
            })
            .filter(item => item !== null); // Remove items marked for removal

         // Update cart in localStorage only if items were filtered out or quantities corrected
         if (cartNeedsUpdate) {
             console.log("Cart updated in localStorage due to missing items or invalid quantities.");
             // Store only essential data back
             const essentialCartData = enrichedCart.map(({ mealId, qty }) => ({ mealId, qty }));
             _setData(CART_KEY, essentialCartData);
         }
        return enrichedCart;
    };

    const addToCart = (mealId, qty = 1) => {
        let cart = _getData(CART_KEY);
        const meals = _getData(MEALS_KEY);
        const mealExists = meals.some(m => m.id === mealId);

        if (!mealExists) {
             console.error("Attempted to add non-existent meal to cart:", mealId);
             return { success: false, cart: getCart(), message: "Meal not found" };
        }

        const existingIndex = cart.findIndex(item => item.mealId === mealId);
        const quantityToAdd = Math.max(1, Number(qty) || 1); // Ensure positive integer

        if (existingIndex > -1) {
            // Ensure resulting quantity doesn't go below 1? Or handle potential overflow?
            cart[existingIndex].qty = (Number(cart[existingIndex].qty) || 0) + quantityToAdd;
        } else {
            cart.push({ mealId, qty: quantityToAdd });
        }

        if(_setData(CART_KEY, cart)) {
            return { success: true, cart: getCart() }; // Return enriched cart after update
        } else {
             console.error("Failed to save cart update to localStorage.");
             // Return potentially inconsistent state if getCart() runs before failure is complete
             return { success: false, cart: getCart(), message: "Failed to save cart update." };
        }
    };

     const updateCart = (mealId, qty) => {
         let cart = _getData(CART_KEY);
         const index = cart.findIndex(item => item.mealId === mealId);
         const quantity = Math.max(1, Number(qty) || 1); // Ensure quantity is at least 1

         if (index > -1) {
             cart[index].qty = quantity;
             if(_setData(CART_KEY, cart)) {
                return { success: true, cart: getCart() };
             } else {
                console.error("Failed to save cart update to localStorage.");
                return { success: false, cart: getCart(), message: "Failed to save cart update." };
             }
         } else {
             return { success: false, cart: getCart(), message: "Item not found in cart" };
         }
     };

      const removeFromCart = (mealId) => {
         let cart = _getData(CART_KEY);
         const initialLength = cart.length;
         const updatedCart = cart.filter(item => item.mealId !== mealId);

         if (updatedCart.length < initialLength) {
             if(_setData(CART_KEY, updatedCart)) {
                return { success: true, cart: getCart() };
             } else {
                console.error("Failed to save cart update to localStorage.");
                return { success: false, cart: getCart(), message: "Failed to save cart update after removal." };
             }
         } else {
              return { success: false, cart: getCart(), message: "Item not found in cart" };
         }
     };

     const clearCart = () => {
        if(_setData(CART_KEY, [])) { // Set to empty array
           return { success: true, cart: [] }; // Return empty array directly
        } else {
           console.error("Failed to clear cart in localStorage.");
           // getCart() might return the old cart if _setData failed badly
           return { success: false, cart: getCart(), message: "Failed to clear cart." };
        }
     };

    // == CHECKOUT & ORDERS ==
    const handlePostCheckout = (body, headers) => {
        const auth = _requireAuth(headers);
        if (!auth.authorized) return auth.error;

        const cart = getCart(); // Get the validated, enriched cart
        if (!cart || cart.length === 0) {
            return { status: 400, body: { success: false, message: 'Cannot checkout with an empty cart.' } };
        }

        // Basic validation for required checkout info
        if (!body || !body.shippingAddress || typeof body.shippingAddress !== 'object' || !body.paymentMethod) {
             return { status: 400, body: { success: false, message: 'Shipping address (as object) and payment method string are required for checkout.' } };
        }
        // Could add more validation for address fields (street, city, zip etc.)

        const orders = _getData(ORDERS_KEY);
        const meals = _getData(MEALS_KEY); // Re-fetch meals in case prices changed just before checkout

        let totalAmount = 0;
        const orderItems = cart.map(item => {
            // Find the current price for the meal
            const currentMeal = meals.find(m => m.id === item.mealId);
            // Use cart price if meal vanished? Or fail checkout? Let's use cart price but log warning.
            const priceAtOrder = currentMeal ? currentMeal.price : item.price;
            if (!currentMeal) {
                console.warn(`Meal ${item.mealId} (${item.name}) was not found during checkout price check. Using cart price: ${priceAtOrder}`);
            }
            totalAmount += priceAtOrder * item.qty;
            return {
                mealId: item.mealId,
                name: item.name, // Store name/details from cart
                qty: item.qty,
                priceAtOrder: priceAtOrder // Price at the moment of checkout
            };
        });

        const newOrder = {
            id: _generateId('ord'),
            userId: auth.userId,
            items: orderItems,
            totalAmount: totalAmount,
            shippingAddress: body.shippingAddress, // e.g., { street: '...', city: '...', zip: '...', country: '...' }
            paymentMethod: body.paymentMethod, // e.g., 'Credit Card ending 1234', 'PayPal'
            status: 'pending', // Initial status
            orderDate: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        orders.push(newOrder);

        if (!_setData(ORDERS_KEY, orders)) {
            return { status: 500, body: { success: false, message: 'Failed to save the new order.' } };
        }

        // Clear the user's cart after successful order placement
        const clearResult = clearCart();
        if (!clearResult.success) {
            console.warn("Order saved successfully, but failed to clear the cart automatically.");
            // Proceed with success response for the order itself
        }

        return { status: 201, body: { success: true, order: newOrder } };
    };

    const handleGetOrders = (params, headers) => {
        const auth = _requireAuth(headers);
        if (!auth.authorized) return auth.error;

        const orders = _getData(ORDERS_KEY);
        const orderId = params.get('id');
        const userOrders = orders.filter(order => order.userId === auth.userId);

        if (orderId) {
            const order = userOrders.find(o => o.id === orderId);
            return order ? { status: 200, body: order } : { status: 404, body: { success: false, message: 'Order not found or does not belong to user' } };
        }

        // Return all orders for the user, newest first
        userOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        return { status: 200, body: userOrders };
    };

    const handlePutOrders = (body, headers) => {
        // This endpoint is primarily for users cancelling their *own* pending orders.
        // Admin status updates would likely need separate logic/permissions.
        const auth = _requireAuth(headers);
        if (!auth.authorized) return auth.error;

        if (!body || !body.id || !body.status) {
           return { status: 400, body: { success: false, message: 'Order ID and new status are required for update' } };
        }

        const orders = _getData(ORDERS_KEY);
        const index = orders.findIndex(o => o.id === body.id);

        if (index === -1) {
            return { status: 404, body: { success: false, message: 'Order not found' } };
        }
        const existingOrder = orders[index];

        if (existingOrder.userId !== auth.userId) {
             return { status: 403, body: { success: false, message: 'Forbidden: You can only modify your own orders.' } };
        }

        // User cancellation logic: Only allow changing to 'cancelled' if status is 'pending'.
        const newStatusLower = body.status.toLowerCase();
        if (newStatusLower !== 'cancelled') {
             return { status: 400, body: { success: false, message: `User cannot set status to '${body.status}'. Only 'cancelled' is allowed.` } };
        }
        if (existingOrder.status !== 'pending') {
            // Order is already processing, shipped, delivered, or already cancelled.
            return { status: 400, body: { success: false, message: `Order cannot be cancelled because its current status is '${existingOrder.status}'. Only 'pending' orders can be cancelled.` } };
        }

        // Update status and timestamp
        existingOrder.status = newStatusLower; // 'cancelled'
        existingOrder.updatedAt = new Date().toISOString();
        orders[index] = existingOrder;

        if (_setData(ORDERS_KEY, orders)) {
            return { status: 200, body: { success: true, order: existingOrder } };
        } else {
            return { status: 500, body: { success: false, message: 'Failed to save updated order data.' } };
        }
    };

    const handleDeleteOrders = (params, headers) => {
        // Allow deleting only orders that are already 'cancelled'.
         const auth = _requireAuth(headers);
         if (!auth.authorized) return auth.error;

         const orderId = params.get('id');
         if (!orderId) {
             return { status: 400, body: { success: false, message: 'Order ID query parameter is required for delete' } };
         }

         const orders = _getData(ORDERS_KEY);
         let orderToDelete = null;
         const indexToDelete = orders.findIndex(o => {
             if (o.id === orderId) {
                 orderToDelete = o;
                 return true;
             }
             return false;
         });

         if (indexToDelete === -1 || !orderToDelete) {
             return { status: 404, body: { success: false, message: 'Order not found' } };
         }

         if (orderToDelete.userId !== auth.userId) {
              return { status: 403, body: { success: false, message: 'Forbidden: You can only delete your own orders.' } };
         }

         // Rule: Allow deletion only if the order status is 'cancelled'
         if (orderToDelete.status !== 'cancelled') {
             return { status: 400, body: { success: false, message: `Cannot delete order with status '${orderToDelete.status}'. Only 'cancelled' orders can be deleted.` } };
         }

        // Proceed with deletion
        const filteredOrders = orders.filter((o, index) => index !== indexToDelete);
        if (_setData(ORDERS_KEY, filteredOrders)) {
            return { status: 200, body: { success: true, message: 'Cancelled order deleted successfully.' } };
        } else {
            return { status: 500, body: { success: false, message: 'Failed to save data after deleting order.' } };
        }
    };


    // == USERS & AUTH ==
    const handleRegister = (body) => {
        if (!body || !body.name || !body.email || !body.password) {
            return { status: 400, body: { success: false, message: 'Name, email, and password required' } };
        }
        if (!/\S+@\S+\.\S+/.test(body.email)) {
            return { status: 400, body: { success: false, message: 'Invalid email format' } };
        }
        if (body.password.length < 6) {
             return { status: 400, body: { success: false, message: 'Password must be at least 6 characters long' } };
        }

        const users = _getData(USERS_KEY);
        const emailLower = body.email.toLowerCase();
        if (users.some(u => u.email.toLowerCase() === emailLower)) {
            return { status: 409, body: { success: false, message: 'Conflict: Email already registered' } };
        }
        const newUser = {
            id: _generateId('usr'),
            name: body.name,
            email: body.email, // Store original case but compare lowercase
            // WARNING: Plain text password (MOCK ONLY!)
            password_plaintext_warning: body.password,
            registeredAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        users.push(newUser);
        if(_setData(USERS_KEY, users)) {
            const { password_plaintext_warning, ...userResponse } = newUser; // Exclude password from response
            return { status: 201, body: { success: true, user: userResponse } };
        } else {
             return { status: 500, body: { success: false, message: 'Failed to save user data.' } };
        }
    };

     const handleLogin = (body) => {
         if (!body || !body.email || !body.password) {
             return { status: 400, body: { success: false, message: 'Email and password required' } };
         }
         const users = _getData(USERS_KEY);
         const emailLower = body.email.toLowerCase();
         // Find user by email (case-insensitive) and check plain text password (MOCK ONLY!)
         const user = users.find(u => u.email.toLowerCase() === emailLower && u.password_plaintext_warning === body.password);

         if (user) {
             // Generate simple token: simulated-{userId}-{timestamp}
             const token = `simulated-${user.id}-${Date.now()}`;
             _setAuthToken(token); // Store token

             const { password_plaintext_warning, ...userResponse } = user; // Exclude password
             return { status: 200, body: {
                 success: true,
                 message: "Login successful.",
                 token: token,
                 user: userResponse
             }};
         } else {
             return { status: 401, body: { success: false, message: 'Invalid email or password' } };
         }
     };

     const handleLogout = (body, headers) => {
         // Logout primarily involves clearing the client-side token
         _clearAuthToken(); // Clear stored token
         return { status: 200, body: { success: true, message: "Logged out successfully." } };
         // Note: No server-side token invalidation in this mock.
     };

     const handleGetUser = (params, headers) => {
         // Get profile of the currently logged-in user based on token
         const auth = _requireAuth(headers);
         if (!auth.authorized) return auth.error; // Auth error already includes status/body

         // _requireAuth already verified the user exists, so find should succeed
         const users = _getData(USERS_KEY);
         const user = users.find(u => u.id === auth.userId);

         if (user) {
             const { password_plaintext_warning, ...userProfile } = user; // Exclude password
             return { status: 200, body: userProfile };
         } else {
             // This case *shouldn't* happen if _requireAuth worked, but handle defensively
             console.error(`FATAL: User ${auth.userId} passed auth but not found in user list!`);
             _clearAuthToken();
             return { status: 404, body: { success: false, message: 'User associated with token not found (data inconsistency). Token cleared.' } };
         }
     };

     const handlePutUser = (body, headers) => {
         // Update profile of the currently logged-in user
         const auth = _requireAuth(headers);
         if (!auth.authorized) return auth.error;

         const users = _getData(USERS_KEY);
         const index = users.findIndex(u => u.id === auth.userId);
         // This check should be redundant due to _requireAuth, but included for safety
         if (index === -1) {
              console.error(`FATAL: User ${auth.userId} passed auth but not found in user list during PUT!`);
              _clearAuthToken();
              return { status: 404, body: { success: false, message: 'User associated with token not found (data inconsistency). Token cleared.' } };
         }

         const updatedUser = { ...users[index] };
         let changesMade = false;

         // Update allowed fields
         if (body.hasOwnProperty('name') && typeof body.name === 'string' && body.name.trim() && body.name !== updatedUser.name) {
            updatedUser.name = body.name.trim();
            changesMade = true;
         }
         if (body.hasOwnProperty('email') && typeof body.email === 'string' && body.email !== updatedUser.email) {
             const newEmail = body.email.trim();
             const newEmailLower = newEmail.toLowerCase();
             if (!/\S+@\S+\.\S+/.test(newEmail)) {
                 return { status: 400, body: { success: false, message: 'Invalid email format' } };
             }
             // Check if new email is already taken by *another* user
             if (users.some(u => u.id !== auth.userId && u.email.toLowerCase() === newEmailLower)) {
                  return { status: 409, body: { success: false, message: 'Conflict: Email already in use by another account' } };
             }
             updatedUser.email = newEmail; // Store original case
             changesMade = true;
         }
         // Password update (MOCK ONLY!) - requires separate verification in real app
         if (body.hasOwnProperty('password') && typeof body.password === 'string' && body.password) {
             if (body.password.length < 6) {
                 return { status: 400, body: { success: false, message: 'New password must be at least 6 characters long' } };
             }
             updatedUser.password_plaintext_warning = body.password; // Update plain text password
             changesMade = true;
             console.warn("Password updated in mock API (plaintext). THIS IS INSECURE.");
         }
         // Add other fields like address, phone etc.
         // Example:
         // if (body.hasOwnProperty('address') && typeof body.address === 'object') {
         //     // Could validate address structure here
         //     updatedUser.address = body.address;
         //     changesMade = true;
         // }

         if (!changesMade) {
             const { password_plaintext_warning, ...userResponse } = updatedUser; // Exclude password
             return { status: 200, body: { success: true, message: "No changes detected.", user: userResponse } };
         }

         updatedUser.updatedAt = new Date().toISOString();
         users[index] = updatedUser;

         if(_setData(USERS_KEY, users)) {
            const { password_plaintext_warning, ...userResponse } = updatedUser; // Exclude password from response
            return { status: 200, body: { success: true, message: "Profile updated successfully.", user: userResponse } };
         } else {
            // Revert changes in memory if save failed? Or just report error? Report error for now.
            return { status: 500, body: { success: false, message: 'Failed to save updated user data.' } };
         }
     };

      const handleDeleteUser = (params, headers) => {
          // Delete the currently logged-in user's account
          const auth = _requireAuth(headers);
          if (!auth.authorized) return auth.error;

          const users = _getData(USERS_KEY);
          const initialLength = users.length;
          const filteredUsers = users.filter(u => u.id !== auth.userId);

          // This check should be redundant due to _requireAuth, but included for safety
          if (filteredUsers.length === initialLength) {
               console.error(`FATAL: User ${auth.userId} passed auth but not found in user list during DELETE!`);
               _clearAuthToken();
               return { status: 404, body: { success: false, message: 'User associated with token not found (data inconsistency). Token cleared.' } };
          }

         // CASCADE DELETE / CLEANUP:
         // Remove associated data owned by this user.
         console.log(`Deleting user ${auth.userId}. Performing cleanup...`);

         // 1. Delete user's appointments
         const appointments = _getData(APPOINTMENTS_KEY);
         const filteredAppointments = appointments.filter(app => app.userId !== auth.userId);
         if (appointments.length !== filteredAppointments.length) {
             console.log(`- Deleting ${appointments.length - filteredAppointments.length} appointments for user ${auth.userId}.`);
             _setData(APPOINTMENTS_KEY, filteredAppointments);
         }

         // 2. Delete user's orders (or anonymize? Let's delete for this mock)
         const orders = _getData(ORDERS_KEY);
         const filteredOrders = orders.filter(ord => ord.userId !== auth.userId);
          if (orders.length !== filteredOrders.length) {
             console.log(`- Deleting ${orders.length - filteredOrders.length} orders for user ${auth.userId}.`);
             _setData(ORDERS_KEY, filteredOrders);
         }

         // 3. User's cart is client-side, will be cleared on next load if token is invalid.
         // 4. Subscriptions are just emails, maybe remove if user's email matches?
         const subscriptions = _getData(SUBSCRIPTIONS_KEY);
         const userToDelete = users.find(u => u.id === auth.userId); // Get user's email
         if (userToDelete) {
             const emailLower = userToDelete.email.toLowerCase();
             const filteredSubscriptions = subscriptions.filter(sub => sub.toLowerCase() !== emailLower);
             if (subscriptions.length !== filteredSubscriptions.length) {
                 console.log(`- Removing subscription for ${userToDelete.email}.`);
                 _setData(SUBSCRIPTIONS_KEY, filteredSubscriptions);
             }
         }

         // Finally, save the filtered user list
          if(_setData(USERS_KEY, filteredUsers)) {
              _clearAuthToken(); // Log the user out after deleting their account
              console.log("Cleanup complete.");
              return { status: 200, body: { success: true, message: 'User account and associated data deleted successfully.' } };
          } else {
              // This is bad - data might be partially deleted.
              console.error("Failed to save user list after deletion. Data may be inconsistent.");
              // Don't clear token if save failed, as user record might still exist partially.
              return { status: 500, body: { success: false, message: 'Failed to save data after deleting user. Data may be inconsistent.' } };
          }
      };

     // == SUBSCRIBE ==
     const handleSubscribe = (body) => {
         if (!body || !body.email) {
             return { status: 400, body: { success: false, message: 'Email is required' } };
         }
         const email = body.email.trim();
         if (!/\S+@\S+\.\S+/.test(email)) {
              return { status: 400, body: { success: false, message: 'Invalid email format' } };
         }

         const subscriptions = _getData(SUBSCRIPTIONS_KEY);
         const emailLower = email.toLowerCase();

         if (subscriptions.some(sub => typeof sub === 'string' && sub.toLowerCase() === emailLower)) {
             // Already subscribed, treat as success (idempotent)
             return { status: 200, body: { success: true, message: 'You are already subscribed.' } };
         }

         // Add the original casing email
         subscriptions.push(email);

         if(_setData(SUBSCRIPTIONS_KEY, subscriptions)) {
            return { status: 201, body: { success: true, message: 'Subscription successful!' } };
         } else {
             return { status: 500, body: { success: false, message: 'Failed to save subscription data.' } };
         }
     };


    // --- Main Request Router ---
    const handleApiRequest = (method, path, params = null, body = null, headers = {}) => {
        method = method.toUpperCase();
        const delay = 50 + Math.random() * 250; // Faster delay: 50-300ms

        // Ensure params is a URLSearchParams object for consistent .get() usage
        let searchParams;
        if (params instanceof URLSearchParams || (typeof window.URLSearchParams !== 'undefined' && params instanceof window.URLSearchParams)) {
            searchParams = params;
        } else {
            // If params is null, undefined, or a plain object, convert it
            searchParams = window.createUrlSearchParams(params); // Handles null/undefined and objects
        }

        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`API Mock Request: ${method} ${path}`, { params: searchParams.toString(), body: body ? '(body present)' : null, headers: headers ? '(headers present)' : null });

                let result;
                try {
                    // --- ROUTING LOGIC ---
                    // Meals
                    if (path === '/api/meals/featured' && method === 'GET') result = handleGetFeaturedMeals();
                    else if (path === '/api/meals' && method === 'GET') result = handleGetMeals(searchParams);
                    else if (path === '/api/meals' && method === 'POST') result = handlePostMeals(body);
                    else if (path === '/api/meals' && method === 'PUT') result = handlePutMeals(body);
                    else if (path === '/api/meals' && method === 'DELETE') result = handleDeleteMeals(searchParams);

                    // Categories
                    else if (path === '/api/categories' && method === 'GET') result = handleGetCategories(searchParams);
                    else if (path === '/api/categories' && method === 'POST') result = handlePostCategories(body);
                    else if (path === '/api/categories' && method === 'PUT') result = handlePutCategories(body);
                    else if (path === '/api/categories' && method === 'DELETE') result = handleDeleteCategories(searchParams);

                    // Meals within Categories (using path parameters)
                    else {
                        const catMealMatch = path.match(/^\/api\/categories\/([^/]+)\/meals$/);
                        if (catMealMatch && catMealMatch[1]) {
                            const categoryId = decodeURIComponent(catMealMatch[1]);
                            if (method === 'GET') result = handleGetMealsInCategory(categoryId);
                            else if (method === 'POST') result = handleAddMealToCategory(categoryId, body); // Body contains { mealId: ... }
                            else if (method === 'DELETE') result = handleRemoveMealFromCategory(categoryId, searchParams); // Params contains ?mealId=...
                        }
                    }

                     // Appointments (Authenticated)
                    if (!result) {
                       if (path === '/api/appointments' && method === 'GET') result = handleGetAppointments(searchParams, headers);
                       else if (path === '/api/appointments' && method === 'POST') result = handlePostAppointments(body, headers);
                       else if (path === '/api/appointments' && method === 'PUT') result = handlePutAppointments(body, headers);
                       else if (path === '/api/appointments' && method === 'DELETE') result = handleDeleteAppointments(searchParams, headers);
                    }

                    // Checkout & Orders (Authenticated)
                    if (!result) {
                        if (path === '/api/checkout' && method === 'POST') result = handlePostCheckout(body, headers);
                        else if (path === '/api/orders' && method === 'GET') result = handleGetOrders(searchParams, headers);
                        else if (path === '/api/orders' && method === 'PUT') result = handlePutOrders(body, headers); // Used for cancelling
                        else if (path === '/api/orders' && method === 'DELETE') result = handleDeleteOrders(searchParams, headers); // Used for deleting cancelled orders
                    }

                    // Users & Auth
                    if (!result) {
                        if (path === '/api/register' && method === 'POST') result = handleRegister(body);
                        else if (path === '/api/login' && method === 'POST') result = handleLogin(body);
                        else if (path === '/api/logout' && method === 'POST') result = handleLogout(body, headers); // Doesn't strictly need headers/body but pass for consistency
                        // Current User Profile Routes (Authenticated)
                        else if (path === '/api/user/me' && method === 'GET') result = handleGetUser(searchParams, headers); // Params usually ignored here
                        else if (path === '/api/user/me' && method === 'PUT') result = handlePutUser(body, headers);
                        else if (path === '/api/user/me' && method === 'DELETE') result = handleDeleteUser(searchParams, headers); // Params usually ignored here
                    }

                    // Subscribe (Public)
                    if (!result) {
                       if (path === '/api/subscribe' && method === 'POST') result = handleSubscribe(body);
                    }

                    // --- Fallback for unhandled routes ---
                    if (!result) {
                        result = { status: 404, body: { success: false, message: `Mock API endpoint not found: ${method} ${path}` } };
                    }
                } catch (error) {
                     // Catch unexpected errors in handler logic
                     console.error("!!! Unexpected Error during API mock request processing:", error);
                     result = { status: 500, body: { success: false, message: `Internal Server Error in Mock API: ${error.message || 'Unknown error'}` } };
                }

                // --- Resolve the promise ---
                console.log(`API Mock Response: ${method} ${path} -> Status ${result?.status || 'N/A'}`, result?.body);
                resolve(result); // Resolve with the result object {status, body}
            }, delay);
        });
    };

    // --- JSON Export/Import ---
    const exportDataToJson = () => {
        try {
            const allData = {};
            const keysToExport = [MEALS_KEY, CATEGORIES_KEY, USERS_KEY, APPOINTMENTS_KEY, ORDERS_KEY, SUBSCRIPTIONS_KEY, CART_KEY];

            keysToExport.forEach(key => {
                allData[key.replace('api_', '')] = _getData(key); // Use simplified key name in JSON
            });

            // Remove sensitive info (passwords) before export
            if (allData.users && Array.isArray(allData.users)) {
                allData.users = allData.users.map(u => {
                    const { password_plaintext_warning, ...userSafe } = u;
                    return userSafe; // Return user object without the password field
                });
            }

            const jsonString = JSON.stringify(allData, null, 2); // Pretty print
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `api_data_export_${timestamp}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log("Data exported to JSON file.");
            return { success: true, message: "Data exported successfully." };
        } catch (error) {
            console.error("Error exporting data:", error);
            return { success: false, message: `Export failed: ${error.message}` };
        }
    };

    const importDataFromJson = (jsonString) => {
        try {
            const importedData = JSON.parse(jsonString);
            let importLog = [];
            let errors = [];

            // Map JSON keys back to localStorage keys
            const dataMap = {
                meals: MEALS_KEY,
                categories: CATEGORIES_KEY,
                users: USERS_KEY,
                appointments: APPOINTMENTS_KEY,
                orders: ORDERS_KEY,
                subscriptions: SUBSCRIPTIONS_KEY,
                cart: CART_KEY
                // AUTH_TOKEN_KEY is usually not imported
            };

            for (const jsonKey in dataMap) {
                if (importedData.hasOwnProperty(jsonKey)) {
                    const storageKey = dataMap[jsonKey];
                    const dataToImport = importedData[jsonKey];

                    // Basic validation: Expect arrays for list keys
                    const listKeys = [MEALS_KEY, CATEGORIES_KEY, USERS_KEY, APPOINTMENTS_KEY, ORDERS_KEY, SUBSCRIPTIONS_KEY, CART_KEY];
                    if (listKeys.includes(storageKey) && !Array.isArray(dataToImport)) {
                         console.warn(`Skipping import for "${jsonKey}": Expected an array, but found ${typeof dataToImport}.`);
                         errors.push(`Invalid format for "${jsonKey}" (expected array)`);
                         continue; // Skip this key
                     }

                     // Add password placeholder back if importing users without it (for mock login)
                     if (storageKey === USERS_KEY && Array.isArray(dataToImport)) {
                         dataToImport.forEach(user => {
                             if (!user.hasOwnProperty('password_plaintext_warning')) {
                                 user.password_plaintext_warning = 'imported_placeholder'; // Add placeholder
                             }
                         });
                     }

                    // Attempt to set data in localStorage
                    if (_setData(storageKey, dataToImport)) {
                        const count = Array.isArray(dataToImport) ? dataToImport.length : 'entry';
                        importLog.push(`Imported ${count} items/entries for "${jsonKey}".`);
                    } else {
                         errors.push(`Failed to save data for "${jsonKey}" to localStorage.`);
                    }
                } else {
                    importLog.push(`Key "${jsonKey}" not found in imported JSON, skipping.`);
                }
            }

            // Provide feedback
            if (errors.length > 0) {
                 return { success: false, message: `Import completed with errors: ${errors.join('; ')}`, log: importLog };
            } else {
                 console.log("Data imported successfully from JSON.", importLog);
                 // Recommend reload or trigger UI update
                 alert("Data imported successfully! You may need to refresh the page to see all changes.");
                 return { success: true, message: "Data imported successfully.", log: importLog };
            }

        } catch (e) {
            console.error("Error importing data from JSON:", e);
            return { success: false, message: `Import failed: Invalid JSON format or processing error (${e.message})` };
        }
    };

     // Helper to trigger file input and read JSON for import
     const triggerJsonImport = (inputElementId) => {
         const fileInput = document.getElementById(inputElementId);
         if (!fileInput || fileInput.type !== 'file') {
             console.error(`Cannot find file input element with ID: ${inputElementId}`);
             alert(`Error: File input element #${inputElementId} not found.`);
             return;
         }

         const changeListener = (event) => {
             const file = event.target.files[0];
             if (file && file.type === 'application/json') {
                 const reader = new FileReader();
                 reader.onload = (e) => {
                     const jsonString = e.target.result;
                     const importResult = importDataFromJson(jsonString);
                     alert(`Import Result: ${importResult.message}`); // Notify user
                     fileInput.value = ''; // Clear input
                     fileInput.removeEventListener('change', changeListener); // Clean up listener
                 };
                 reader.onerror = (e) => {
                     console.error("Error reading file:", e);
                     alert("Error reading the selected file.");
                     fileInput.value = '';
                     fileInput.removeEventListener('change', changeListener);
                 };
                 reader.readAsText(file);
             } else if (file) {
                 alert("Invalid file type. Please select a JSON file (.json).");
                 fileInput.value = '';
                 fileInput.removeEventListener('change', changeListener);
             } else {
                 // No file selected, remove listener
                  fileInput.removeEventListener('change', changeListener);
             }
         };

         // Add listener before click, remove after handling
         fileInput.addEventListener('change', changeListener, { once: true }); // Use {once: true} if supported, otherwise remove manually
         fileInput.click();
     };


    // --- Initialize Data on Load ---
    // Call this AFTER all function definitions but BEFORE returning the public interface.
    initializeData();

    // --- Public Interface (for browser console: Api.*) ---
    return {
        // Core request handler (useful for custom requests)
        handleRequest: handleApiRequest,

        // Direct Cart Functions (client-side convenience)
        getCart: getCart,
        addToCart: addToCart,
        updateCart: updateCart,
        removeFromCart: removeFromCart,
        clearCart: clearCart,

        // Authentication Helpers
        isLoggedIn: () => _validateToken(_getAuthToken()),
        getCurrentUserToken: _getAuthToken,
        getCurrentUserId: () => _getUserIdFromToken(_getAuthToken()),
        logout: () => { // Explicit logout function using handler
             const result = handleApiRequest('POST', '/api/logout');
             result.then(res => console.log("Logout via Api.logout():", res.body.message));
             return result; // Return the promise
        },

        // --- Endpoint Wrappers for Easier Console/Client Use (Returning Promises) ---

        // Meals
        getMeals: (params = {}) => handleApiRequest('GET', '/api/meals', window.createUrlSearchParams(params)),
        getFeaturedMeals: () => handleApiRequest('GET', '/api/meals/featured'),
        getMealById: (id) => handleApiRequest('GET', '/api/meals', window.createUrlSearchParams({ id: id })),
        createMeal: (mealData) => handleApiRequest('POST', '/api/meals', null, mealData),
        updateMeal: (mealData) => handleApiRequest('PUT', '/api/meals', null, mealData), // Requires id in mealData
        deleteMeal: (id) => handleApiRequest('DELETE', '/api/meals', window.createUrlSearchParams({ id: id })),

        // Categories
        getCategories: (params = {}) => handleApiRequest('GET', '/api/categories', window.createUrlSearchParams(params)),
        getCategoryById: (id) => handleApiRequest('GET', '/api/categories', window.createUrlSearchParams({ id: id })),
        createCategory: (catData) => handleApiRequest('POST', '/api/categories', null, catData),
        updateCategory: (catData) => handleApiRequest('PUT', '/api/categories', null, catData), // Requires id in catData
        deleteCategory: (id) => handleApiRequest('DELETE', '/api/categories', window.createUrlSearchParams({ id: id })),

        // Meals <-> Categories Relationships
        getMealsInCategory: (categoryId) => handleApiRequest('GET', `/api/categories/${categoryId}/meals`),
        addMealToCategory: (categoryId, mealId) => handleApiRequest('POST', `/api/categories/${categoryId}/meals`, null, { mealId: mealId }),
        removeMealFromCategory: (categoryId, mealId) => handleApiRequest('DELETE', `/api/categories/${categoryId}/meals`, window.createUrlSearchParams({ mealId: mealId })),

        // Appointments (Requires Auth Headers Handled Automatically via _requireAuth using localStorage token)
        getAppointments: (params = {}) => handleApiRequest('GET', '/api/appointments', window.createUrlSearchParams(params)),
        getAppointmentById: (id) => handleApiRequest('GET', '/api/appointments', window.createUrlSearchParams({ id: id })),
        createAppointment: (appData) => handleApiRequest('POST', '/api/appointments', null, appData),
        updateAppointment: (appData) => handleApiRequest('PUT', '/api/appointments', null, appData), // Requires id
        deleteAppointment: (id) => handleApiRequest('DELETE', '/api/appointments', window.createUrlSearchParams({ id: id })),

        // Orders (Requires Auth Headers Handled Automatically)
        checkout: (checkoutData) => handleApiRequest('POST', '/api/checkout', null, checkoutData),
        getOrders: (params = {}) => handleApiRequest('GET', '/api/orders', window.createUrlSearchParams(params)),
        getOrderById: (id) => handleApiRequest('GET', '/api/orders', window.createUrlSearchParams({ id: id })),
        updateOrderStatus: (orderId, status) => handleApiRequest('PUT', '/api/orders', null, { id: orderId, status: status }), // For cancelling
        deleteOrder: (id) => handleApiRequest('DELETE', '/api/orders', window.createUrlSearchParams({ id: id })), // For deleted cancelled orders

        // Auth & User (Public for register/login, Auth Handled Automatically for profile actions)
        register: (userData) => handleApiRequest('POST', '/api/register', null, userData),
        login: (credentials) => handleApiRequest('POST', '/api/login', null, credentials),
        // logout is defined above
        getUserProfile: () => handleApiRequest('GET', '/api/user/me'), // Gets current user's profile
        updateUserProfile: (userData) => handleApiRequest('PUT', '/api/user/me', null, userData),
        deleteUserAccount: () => handleApiRequest('DELETE', '/api/user/me'), // Deletes current user


        // Subscribe (Public)
        subscribe: (email) => handleApiRequest('POST', '/api/subscribe', null, { email: email }),

        // --- JSON Data Management ---
        exportDataToJson: exportDataToJson,
        // importDataFromJson: importDataFromJson, // Internal helper, use triggerJsonImport
        triggerJsonImport: triggerJsonImport // Public helper requires a file input element ID
    };

})(); // End of API Simulation Module IIFE

// Example of how to use triggerJsonImport in HTML:
// 1. Add to HTML: <input type="file" id="jsonImportFile" accept=".json" style="display: none;">
// 2. Add a button/link: <button onclick="Api.triggerJsonImport('jsonImportFile')">Import Data from JSON</button>
// 3. Or call from console: Api.triggerJsonImport('jsonImportFile')