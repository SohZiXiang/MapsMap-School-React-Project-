// src/App.js
import React, { useState } from "react";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { Google as GoogleIcon, LooksOne as LooksOneIcon } from "@mui/icons-material";
import Map from "./components/GMap"; // Ensure the path is correct
import Info from "./components/OneMap"; // Placeholder for another page
import Settings from "./components/Settings"; // Placeholder for settings page

const App = () => {
  const [value, setValue] = useState(0);

  const renderComponent = () => {
    switch (value) {
      case 0:
        return <Map />;
      case 1:
        return <Info />;
      case 2:
        return <Settings />;
      default:
        return <Map />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        margin: 0,
      }}
    >
      {" "}
      {/* Ensure no margin */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {" "}
        {/* Prevent scroll on this div */}
        <div
          style={{ height: "100%", overflowY: "auto", margin: 0, padding: 0 }}
        >
          {" "}
          {/* Allow scrolling on this div and remove margins */}
          {renderComponent()}
        </div>
      </div>
      <Paper
        elevation={3}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000, // Ensure it's on top of other content
        }}
      >
        <BottomNavigation
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
          }}
          showLabels
        >
          <BottomNavigationAction label="Google Map" icon={<GoogleIcon />} />
          <BottomNavigationAction label="One Map" icon={<LooksOneIcon />} />
        </BottomNavigation>
      </Paper>
    </div>
  );
};

export default App;