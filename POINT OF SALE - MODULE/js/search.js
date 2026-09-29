function searchProducts(query, category){
  const q = query.trim().toLowerCase();
  return arrayFilter(DATA.products, function(p){
    return p.category === category && p.name.toLowerCase().indexOf(q) !== -1;
  });
}
