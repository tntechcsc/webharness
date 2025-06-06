import introJs from "intro.js";
import "intro.js/minified/introjs.min.css";
import { useTheme } from "@mui/material/styles";
import { fetchRole } from "./authUtils";
import { useEffect, useState } from "react";

export const useStartTutorial = () => {
  const [userRole, setUserRole] = useState("Viewer"); 
  const theme = useTheme();
  useEffect(() => {
    fetchRole().then((role) => {
      setUserRole(role);
    });
  }, []);
  const startTutorialManually = (currentPage) => {
    let steps = [];

    if (currentPage === "homepage") {
      steps = [
        { element: "#applications-card", intro: "This card shows the number of active applications." },
        { element: "#active-applications", intro: "This progress bar displays the percentage of active applications." },
        { element: "#recent-logins", intro: "This section shows the most recent user logins." },
        { element: "#system-logs", intro: "System logs provide important operational details." },
        { element: "#resource-utilization", intro: "This chart shows the resource utilization of running applications." },
      ];
    } else if (currentPage === "applications") {
      steps = [
        { element: "#applications-overview", intro: "This section gives an overview of all applications." },
        { element: "#add-application-button", intro: "Click here to add a new application." },
        { element: "#add-category-button", intro: "Click here to add and delete categories." },
        { element: "#search-bar", intro: "Use this search bar to quickly find applications." },
        { element: "#run-button", intro: "Click this button to start an application." },
        { element: "#view-button", intro: "Click this button to view an application in detail." },
      ];
    } else if (currentPage === "role-management" && userRole !== "Viewer") {
      steps = [
        { element: "#register-user", intro: "Click here to register a new user." },
        { element: "#search-users", intro: "Click here to search for a user." },
      ];

      // Check if the reset-password button exists
      if (document.querySelector("#reset-password")) {
        steps.push({
          element: "#reset-password",
          intro: "Click here to reset the user's password. This will give the user a new auto-generated password.",
        });
      }

      // Check if the delete-user button exists
      if (document.querySelector("#delete-user")) {
        steps.push({
          element: "#delete-user",
          intro: "Click here to delete this user.",
        });
      }
    }

    if (steps.length > 0) {
      const intro = introJs();
      intro.setOptions({
        steps,
        showProgress: true,
        exitOnOverlayClick: false,
        disableInteraction: true,
        doneLabel: "Finish",
        tooltipClass: "custom-intro-tooltip",
      });

      intro.start();
    }

    // Apply theme styles dynamically
    const tooltipStyles = document.createElement("style");
    tooltipStyles.innerHTML = `
      .custom-intro-tooltip {
        background-color: ${theme.palette.background.paper} !important;
        color: ${theme.palette.text.primary} !important;
        border: 2px solid ${theme.palette.primary.main} !important;
      }
    `;
    document.head.appendChild(tooltipStyles);
  };

  return { startTutorialManually };
};
