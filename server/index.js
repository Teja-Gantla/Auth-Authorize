import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import StudentModel from "./models/Student.js";

const app = express();

//⏩ MIDDLEWARE
//The data will pass in frontend and convert it into json format
app.use(express.json());
// Parses cookies from incoming requests
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"], // Allows requests from http://localhost:5173
    credentials: true, // Allows sending cookies[Cookies are small text files stored on a user's device by a website to remember information about the user.] and authentication credentials
  })
);

//⏩ DATABASE[MONGODB] CONNECTION
const dbURL = "mongodb://127.0.0.1:27017/data";
mongoose
  .connect(dbURL)
  .then(() => console.log("mongodb connection is established"))
  .catch((err) => console.error("Failed to connect!", err));

//⏩ ROUTES
// Protected Routes[REGISTER ROUTE]
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  StudentModel.create({ name, email, password })
    .then((user) => res.json(user))
    .catch((err) => res.json(err));
});

// Handles login requests, verifies user credentials, creates and sets access and refresh tokens, returns success or failure response.
// ⏩ REFRESH TOKENS:[Refresh token is a long-lived token used to obtain new access tokens without requiring re-authentication.]
// ⏩ ACCESS TOKEN:[Access token is a short-lived credential that proves a user is authorized to access specific resources or perform actions.]
//DIFFERENCE B/W BOTH OF THEM:Access tokens are temporary credentials that grant access to a protected resource, while refresh tokens are used to obtain new access tokens once the current ones expire.
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  StudentModel.findOne({ email })
    .then((user) => {
      if (user) {
        if (user.password === password) {
          const accessToken = jwt.sign(
            { email: email },
            "jwt-access-token-secret-key",
            { expiresIn: "1m" }
          );
          const refreshToken = jwt.sign(
            { email: email },
            "jwt-refresh-token-secret-key",
            { expiresIn: "5m" }
          );

          res.cookie("accessToken", accessToken, { maxAge: 60000 });
          res.cookie("refreshToken", refreshToken, {
            maxAge: 300000,
            httpOnly: true,
            secure: true,
            sameSite: "strict",
          });
          return res.json({ Login: true });
        }
      } else {
        res.json({ Login: false, Message: "no record" });
      }
    })
    .catch((err) => res.json(err));
});

const varifyUser = (req, res, next) => {
  const accesstoken = req.cookies.accessToken;
  if (!accesstoken) {
    if (renewToken(req, res)) {
      next();
    }
  } else {
    jwt.verify(accesstoken, "jwt-access-token-secret-key", (err, decoded) => {
      // Verifies user authentication using access token or refreshes token if necessary, proceeds to next middleware or sends unauthorized response.
      if (err) {
        return res.json({ valid: false, message: "Invalid Token" });
      } else {
        req.email = decoded.email;
        next();
      }
    });
  }
};

const renewToken = (req, res) => {
  // Generated the new access token using the information stored in the refresh token if it's valid and indicates success incase if it's notvalid and indicates failure.
  const refreshtoken = req.cookies.refreshToken;
  let exist = false;
  if (!refreshtoken) {
    return res.json({ valid: false, message: "No Refresh token" });
  } else {
    jwt.verify(refreshtoken, "jwt-refresh-token-secret-key", (err, decoded) => {
      if (err) {
        return res.json({ valid: false, message: "Invalid Refresh Token" });
      } else {
        const accessToken = jwt.sign(
          { email: decoded.email },
          "jwt-access-token-secret-key",
          { expiresIn: "1m" }
        );
        res.cookie("accessToken", accessToken, { maxAge: 60000 });
        exist = true;
      }
    });
  }
  return exist;
};

// This route is restricted and requires valid user authentication. If the user is authenticated, it allows access and sends a success message.
app.get("/dashboard", varifyUser, (req, res) => {
  return res.json({ valid: true, message: "authorized" });
});

//⏩ SERVER
const PORT = 3000;
app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
