const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 5000;
const success_url = process.env.S_URL;
const failure_url = process.env.F_URL;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

console.log(success_url, failure_url);
// const stripe = require("stripe")(
//   "sk_test_51NsnOGSICQL4cc0kKd26zffi52MP3A1zTzYklhT8P03N3vnGdGO4D2EC1qgBMn3z3kHVwWteoguEzApH2YPwgeEe00U45tZ8tU"
// );
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();
app.use(express.json());
// app.use(cors());

//My routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const User = require("./models/user");

//Middlewares
app.use(bodyParser.json());
app.use(cookieParser());

app.use(
  cors({
    origin: ["https://miplace-app.onrender.com" , "http://localhost:3000"],
  })
);

//My Routes
app.use("/api", authRoutes);
app.use("/api", userRoutes);

//* Admin routes
// Get all users
app.get("/api/allUsers", async (req, res) => {
  try {
    const allUsers = await User.find({});
    res.json(allUsers);
  } catch (error) {
    console.log("error");
  }
});
// Delete a user
app.post("/api/deleteUser", async (req, res) => {
  const { id, name } = req.body;
  try {
    await User.deleteOne({ _id: id });
    console.log("Deleted");
  } catch (error) {
    console.log("error");
  }
  res.json({ status: "Good" });
});
// Update a user
app.put("/api/updateUser", async (req, res) => {
  const { id } = req.body;
  try {
    await User.updateOne({ _id: id }, { $set: { admin: true } });
    console.log("updated");
  } catch (error) {
    console.log("error");
  }
  res.json({ status: "Good" });
});

//* Test EndPoint
app.get("/test", (req, res) => {
  res.json({ Test: "All Good" });
});
//DB Connection
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("DB CONNECTED");
  });

//checkout api
app.post("/api/create-checkout-session", async (req, res) => {
  // console.log(req.body);
  const { products } = req.body;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "inr", // Change to your desired currency
          product_data: {
            name: products[0].hotel_name,
            images: [products[0].main_photo_url],
          },
          // currencyPrice * (noOfDays + 1) * rooms
          unit_amount:
            parseInt(
              products[0].currencyPrice *
                (products[0].noOfDays + 1) *
                products[0].rooms *
                100
            ) > 500000
              ? 10000 * 100
              : parseInt(
                  products[0].currencyPrice *
                    (products[0].noOfDays + 1) *
                    products[0].rooms *
                    100
                ),
          // unit_amount: products[0].currencyPrice * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: success_url,
    cancel_url: failure_url,
  });
  res.json({ id: session.id });
  console.log(products);
});

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", { PORT });
});
