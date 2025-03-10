import { grey, blue, orange, purple } from "@material-ui/core/colors"

export default {
  container: {
    fontSize: 11,
    fontWeight: "bold",
    color: "white",
    maxHeight: "calc(100vh - 200px)", // Limit height and enable scrolling
    overflowY: "auto",
    "&::-webkit-scrollbar": {
      width: "8px",
      height: "8px",
    },
    "&::-webkit-scrollbar-track": {
      background: "#1e1e1e",
      borderRadius: "4px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#4a4a4a",
      borderRadius: "4px",
      "&:hover": {
        background: "#5a5a5a"
      }
    },
    "& .icon": {
      marginTop: 4,
      width: 16,
      height: 16,
    },
    "& .icon2": {
      opacity: 0.5,
      width: 16,
      height: 16,
      transition: "200ms opacity",
      "&:hover": {
        cursor: "pointer",
        opacity: 1,
      },
    },
  },
  rowContainer: {
    overflowY: "auto", // Enable vertical scrolling
    overflowX: "hidden", // Disable horizontal scrolling
    paddingLeft: 10,


  },
  row: {
    padding: 4,
    cursor: "pointer",
    "&.header:hover": {
      backgroundColor: "#fff",
    },
    "&.highlighted": {
      backgroundColor: blue[100],
    },
    "&:hover": {
      backgroundColor: blue[50],
      color: grey[800],
    },
  },
  chip: {
    display: "flex",
    flexDirection: "row",
    padding: 2,
    borderRadius: 2,
    paddingLeft: 4,
    paddingRight: 4,
    alignItems: "center",
    "& .color": {
      borderRadius: 5,
      width: 10,
      height: 10,
      marginRight: 4,
    },
    "& .text": {},
  },
}
