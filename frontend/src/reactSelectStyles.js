const getReactSelectStyles = (theme) => ({
    control: (provided, state) => ({
      ...provided,
      backgroundColor: theme.palette.background.paper, // Use theme background
      color: theme.palette.text.primary, // Use theme text color
      borderColor: state.isFocused ? "#555" : "#333",
      "&:hover": {
        borderColor: "#777",
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: theme.palette.background.paper,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#333" // Selected item background
        : state.isFocused
        ? "#444" // Hovered item background
        : theme.palette.background.paper,
      color: "#fff",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: theme.palette.text.primary,
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#333",
      color: "#fff",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "#fff",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "#fff",
      ":hover": {
        backgroundColor: "#555",
        color: "#fff",
      },
    }),
  });
  
  export default getReactSelectStyles;
  