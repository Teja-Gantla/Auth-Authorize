// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Dahsboard = () => {
  const [message, setMessage] = useState();
  const navigate = useNavigate();

  axios.defaults.withCredentials = true;

  useEffect(() => {
    axios
      .get("http://localhost:3000/dashboard")
      .then((res) => {
        if (res.data.valid) {
          setMessage(res.data.message);
        } else {
          navigate("/");
        }
      })
      .catch((err) => console.error(err));
  });

  return <div>Dashboard {message}</div>;
};

export default Dahsboard;
