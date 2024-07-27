// eslint-disable-next-line no-unused-vars
import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div>
      Home
      <br />
      <br />
      <button>
        <Link to="/register">Register</Link>
      </button>
      <br />
      <br />
    </div>
  );
};

export default Home;
