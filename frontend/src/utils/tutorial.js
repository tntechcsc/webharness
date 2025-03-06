import introJs from "intro.js";
import "intro.js/minified/introjs.min.css";

export const startTutorialManually = (currentPage) => {
  let steps = [];

  if (currentPage === "homepage") {
    steps = [
      { element: "#applications-card", intro: "This card shows the number of active applications." },
      { element: "#active-applications", intro: "This progress bar displays the percentage of active applications." },
      { element: "#failed-applications", intro: "This chart displays application failures over time." },
      { element: "#recent-logins", intro: "This section shows the most recent user logins." },
      { element: "#upcoming-events", intro: "This card displays any scheduled upcoming events." },
      { element: "#system-logs", intro: "System logs provide important operational details." },
    ];
  } else if (currentPage === "applications") {
    steps = [
      { element: "#applications-overview", intro: "This section gives an overview of all applications." },
      { element: "#add-application-button", intro: "Click here to add a new application." },
      { element: "#search-bar", intro: "Use this search bar to quickly find applications." },
      { element: "#run-button", intro: "Click this button to start an application." },
      { element: "#view-button", intro: "Click this button to view an application in detail." },
    ];
  }

  if (steps.length > 0) {
    const intro = introJs();
    intro.setOptions({
      steps,
      showProgress: true,
      exitOnOverlayClick: false,
      disableInteraction: true,
      doneLabel: "Finish",
    });

    intro.start();
  }
};

