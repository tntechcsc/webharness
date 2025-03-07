const getReactSelectStyles = (theme) => ({
  control: (provided, state) => ({
    ...provided,
    backgroundColor: theme.palette.background.paper,
    borderColor: state.isFocused ? theme.palette.primary.main : theme.palette.divider,
    color: theme.palette.text.primary,
    "&:hover": {
      borderColor: theme.palette.primary.main,
    },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[3],
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? theme.palette.primary.main
      : state.isFocused
      ? theme.palette.action.hover
      : theme.palette.background.paper,
    color: state.isSelected ? theme.palette.primary.contrastText : theme.palette.text.primary,
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.text.primary,
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: theme.palette.text.primary,
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: theme.palette.mode === "dark" ? theme.palette.primary.dark : theme.palette.primary.light,
    borderRadius: "4px",
    padding: "2px",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: theme.palette.mode === "dark" ? theme.palette.text.primary : theme.palette.text.secondary,
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: theme.palette.mode === "dark" ? theme.palette.error.light : theme.palette.error.dark,
    "&:hover": {
      backgroundColor: theme.palette.error.light,
      color: "#ffffff",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: theme.palette.text.secondary,
  }),
  indicatorSeparator: (provided) => ({
    ...provided,
    backgroundColor: theme.palette.divider,
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: theme.palette.text.secondary,
    "&:hover": {
      color: theme.palette.primary.main,
    },
  }),
});

export default getReactSelectStyles;