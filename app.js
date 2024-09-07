const express = require('express')
const app = express()
const port = 8080; 

// Example search logic
const searchHandler = async (queryParams) => {
  // Implement the actual search logic here.
  // This can be a database query, an API call, or any custom logic based on query parameters.
  
  // Example logic: Returning a dummy response with the query params for now.
  return {
    message: "Search results",
    query: queryParams
  };
};

// API route to handle search requests
app.get('/api/search', async (req, res) => {
  try {
    // Call the searchHandler with the query parameters
      let result = await searchHandler(req.query);  

    // Send response back to client
      res.status(200).send(result);
    } catch (error) {
      // Handle any errors that occur
      res.status(500).send({error: 'An error occurred during search'});
    }
  }
)

// Serve static files from the "dist" directory
  app.use(express.static('dist'));

// Handle 404 page separately
  app.get('/404', (req, res) => {
  res.status(404).sendFile(__dirname + '/dist/404.html'); // Assuming there's a 404.html in the dist directory
  }
);

// Catch-all for undefined routes and redirect to the /404 route
  app.get('*', (req, res) => {
  res.redirect('/404');
  }
);

  app.listen(port, () => {
  console.log(`Digital garden running on port ${port}`);
  }
);


