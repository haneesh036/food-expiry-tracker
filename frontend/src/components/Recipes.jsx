import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { ChefHat, ExternalLink, RefreshCw } from 'lucide-react';
import { API_URL } from '../config';

const Recipes = () => {
  const [items, setItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItemsAndRecipes();
  }, []);

  const fetchItemsAndRecipes = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.get(`${API_URL}/api/items?user_id=${user.id}`);
      
      const allItems = res.data;
      const today = moment().startOf('day');
      
      // Get items expiring in <= 3 days that are still active
      const expiringItems = allItems.filter(item => {
        if (item.status !== 'active' || !item.expiry_date) return false;
        const expiry = moment(item.expiry_date);
        const daysDiff = expiry.diff(today, 'days');
        return daysDiff >= 0 && daysDiff <= 4; // Up to 4 days for more results
      });

      setItems(expiringItems);

      // Extract unique single-word ingredients (naive approach for TheMealDB)
      const ingredients = [...new Set(expiringItems.map(i => {
        // Just take the first word as ingredient to increase match chance, e.g. "Chicken Breast" -> "Chicken"
        return i.product_name.split(' ')[0].toLowerCase();
      }))];

      if (ingredients.length > 0) {
        // Fetch recipes for the first few ingredients
        const recipePromises = ingredients.slice(0, 3).map(ing => 
          axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ing}`).catch(() => null)
        );
        
        const recipeResponses = await Promise.all(recipePromises);
        let foundRecipes = [];
        
        recipeResponses.forEach(res => {
          if (res && res.data && res.data.meals) {
            foundRecipes = [...foundRecipes, ...res.data.meals];
          }
        });
        
        // Remove duplicates
        const uniqueRecipes = Array.from(new Map(foundRecipes.map(r => [r.idMeal, r])).values());
        setRecipes(uniqueRecipes.slice(0, 9)); // Show max 9
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Smart Recipes</h1>
          <p className="text-sm text-slate-500">Suggested meals based on items expiring soon</p>
        </div>
        <button onClick={fetchItemsAndRecipes} className="btn btn-outline flex items-center justify-center gap-2 bg-white">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-primary)]"></div>
        </div>
      ) : (
        <>
          {items.length === 0 ? (
            <div className="card text-center p-12 flex flex-col items-center">
              <div className="bg-green-100 p-4 rounded-full mb-4">
                <ChefHat className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No items expiring soon!</h3>
              <p className="text-slate-500 max-w-sm">
                Your fridge is looking good. When items are close to expiring, we'll suggest recipes here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-sm text-amber-800 font-medium">
                  We found <span className="font-bold">{items.length}</span> items expiring soon:
                  {items.map(i => i.product_name).join(', ')}.
                </p>
              </div>

              {recipes.length === 0 ? (
                <div className="card text-center p-12">
                  <p className="text-slate-500">We couldn't find specific recipes for these ingredients.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recipes.map(recipe => (
                    <div key={recipe.idMeal} className="card p-0 overflow-hidden flex flex-col group">
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={recipe.strMealThumb} 
                          alt={recipe.strMeal} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-2">{recipe.strMeal}</h3>
                        <div className="mt-auto pt-4">
                          <a 
                            href={`https://www.themealdb.com/meal/${recipe.idMeal}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full btn border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            View Recipe
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Recipes;
