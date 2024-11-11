import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "react-bootstrap/Navbar";
import { Container, Nav } from "react-bootstrap";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import axiosInstance from "./AxiosInstance";
import Dropdown from "react-bootstrap/Dropdown";

const Register = () => {
  const navigate = useNavigate();
  const [clicked, setClicked] = useState(false);
  const [selectedOption, setSelectedOption] = useState("Select User");
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    type: "",
  });

  useEffect(() => {
    setData((prevData) => ({ ...prevData, type: selectedOption }));
  }, [selectedOption]);

  const handleSelect = (eventKey) => {
    setSelectedOption(eventKey);
    setData({ ...data, type: eventKey });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.name || !data.email || !data.password || !data.type) {
      return alert("Please fill all fields");
    } else if (!emailPattern.test(data.email)) {
      return alert("Please enter a valid email address");
    }

    axiosInstance
      .post("/api/user/register", data)
      .then((response) => {
        console.log("API Response:", response);
        if (response.data.success) {
          alert(response.data.message);
          navigate("/login");
        } else {
          alert(response.data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error.response || error.message || error);
        if (error.response) {
          alert(
            `Registration failed: ${
              error.response.data.message || "Please try again."
            }`
          );
        } else {
          alert(
            "Registration failed. Please check your network or try again later."
          );
        }
      });
  }; 

  return (
    <>
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container fluid>
          <Navbar.Brand>
            <h2>Study App</h2>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarScroll" />
          <Navbar.Collapse id="navbarScroll">
            <Nav
              className="me-auto my-2 my-lg-0"
              style={{ maxHeight: "100px" }}
              navbarScroll
            />
            <Nav>
              <Link to="/" style={{ marginRight: "10px" }}>
                Home
              </Link>
              <Link to="/login" style={{ marginRight: "10px" }}>
                Login
              </Link>
              <Link to="/register">Register</Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container
        component="main"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <Box
          sx={{
            marginTop: 8,
            marginBottom: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "20px",
            background: "#f7f7f9",
            border: "1px solid lightblue",
            borderRadius: "8px",
            boxShadow: 2,
          }}
        >
          <Avatar sx={{ bgcolor: "secondary.main" }}>
            {/* Optional icon */}
          </Avatar>
          <Typography component="h1" variant="h5">
            Register
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              value={data.name}
              onChange={handleChange}
              autoComplete="name"
              autoFocus
            />
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              value={data.email}
              onChange={handleChange}
              autoComplete="email"
            />
            <TextField
              margin="normal"
              fullWidth
              name="password"
              value={data.password}
              onChange={handleChange}
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
            />
            <Dropdown className="my-3">
              <Dropdown.Toggle variant="outline-secondary" id="dropdown-basic">
                {selectedOption}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleSelect("Student")}>
                  Student
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleSelect("Teacher")}>
                  Teacher
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Box mt={2}>
              <Button
                type="submit"
                variant="contained"
                color={clicked ? "secondary" : "primary"}
                onClick={() => setClicked(!clicked)}
                sx={{ mt: 3, mb: 2 }}
                style={{ width: "200px" }}
              >
                Sign Up
              </Button>
            </Box>
            <Grid container>
              <Grid item>
                Have an account?
                <Link style={{ color: "blue", marginLeft: "5px" }} to="/login">
                  Sign In
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default Register;
