const authentication = async (req, res, next) => {
  console.log("AUTH");

  // 1. check for token is available
  // 2. validate token
  // 3. extract playload of token
  // 4. attach user details to request for further use
  next();
};

export { authentication };
