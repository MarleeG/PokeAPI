const inquirer = require("inquirer");
const axios = require("axios");

const LIST_CHOICE = "List Pokémon using limit and offset.";
const WEIGHT_HEIGHT_CHOICE = "Get Pokémon's height and weight.";
const AVERAGE_WEIGHT_HEIGHT_CHOICE = "Get Pokémon's average height and weight.";

let current_user_choice = "";
let pokemon_arr = [];
let start = 0;
let end = 0;

// resets variables for the prompts and performance stats
const reset = () => {
  current_user_choice = "";
  start = 0;
  end = 0;
};

// Logs the time it took for a task to complete
const showPerformanceStats = () => {
  console.log(`Execution time: ${(end - start) / 1000} seconds`);
};

// handles errors for requests
const handleError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log("Error", error.message);
  }
  console.log(error.config);
};

// Requesting data for multiple Pokemon
const handleGetAverageWeightHeight = (multipleRequestsArr) => {
  // setting the time of task starting using the Date object
  start = Date.now();

  axios
    .all(multipleRequestsArr)
    .then((responses) => {
      const LENGTH = responses.length;
      let all_weight = 0;
      let all_height = 0;

      for (const data of responses) {
        if (data.status !== 200) {
          console.log("An error has occured!");
        } else {
          const { id, name, weight, height } = data.data;
          console.log({ id, name, weight, height });
          all_weight = all_weight + weight;
          all_height = all_height + height;
        }
      }

      const average_weight = all_weight / LENGTH;
      const average_height = all_height / LENGTH;

      console.log("Average weight and height.");
      console.table({ average_weight, average_height });
      end = Date.now();
      showPerformanceStats();
      reprompt();
    })
    .catch((error) => {
      handleError(error);
    });
};

// Requesting data
const getAPIData = (url) => {
  // setting the time of task starting using the Date object
  start = Date.now();

  axios
    .get(url)
    .then((response) => {
      if (response.status !== 200) {
        console.log("An error has occured!");
      } else {
        switch (current_user_choice) {
          case LIST_CHOICE:
            console.table(response.data.results);
            pokemon_arr = response.data.results;

            end = Date.now();
            showPerformanceStats();
            reprompt();
            break;

          case WEIGHT_HEIGHT_CHOICE:
            const { id, name, height, weight } = response.data;
            console.table({
              id,
              name,
              height: `${height} ft`,
              weight: `${weight} lbs`,
            });
            end = Date.now();
            showPerformanceStats();
            reprompt();
            break;
          default:
            console.log("Something went wrong.");
            reset()
            reprompt();
        }
      }
    })
    .catch((error) => {
      handleError(error);
    });
};

// validates if input is a number
const validateInput = (val) => {
  return !isNaN(parseInt(val)) ? true : "Please enter a valid number!";
};

// Will prompt the user to select an option provided
// Actions will depend on the users selected option
const getUserChoice = () => {
  current_user_choice = "";
  reset();

  // These are initial questions that will be asked
  let choices = [
    {
      key: "a",
      value: LIST_CHOICE,
    },
    {
      key: "b",
      value: WEIGHT_HEIGHT_CHOICE,
    },
  ];

  // once option at choices[0] is selected at least once the user will be allowed to select a 3rd option
  if (pokemon_arr.length > 0) {
    choices = [
      ...choices,
      {
        key: "c",
        value: AVERAGE_WEIGHT_HEIGHT_CHOICE,
      },
    ];
  }

  inquirer
    .prompt([
      {
        name: "initial_query",
        type: "expand",
        message: "Select one of these options.",
        choices: choices,
      },
    ])
    .then((answers) => {
      const { initial_query } = answers;

      // Users selection will dictate which case matches and what is executed   
      switch (initial_query) {
        case LIST_CHOICE:
          getPokemonList();
          current_user_choice = LIST_CHOICE;
          break;
        case WEIGHT_HEIGHT_CHOICE:
          current_user_choice = WEIGHT_HEIGHT_CHOICE;
          getPokemonWeightHeight();
          break;
        case AVERAGE_WEIGHT_HEIGHT_CHOICE:
          current_user_choice = AVERAGE_WEIGHT_HEIGHT_CHOICE;
          getPokemonAverageWeightHeight();
          break;
        default:
          console.log("Something went wrong.");
          reprompt();
          reset();
      }
    });
};

// This will give the user a choice if they would like to query the PokeAPI again
const reprompt = () => {
  inquirer
    .prompt([
      /* Pass your questions in here */
      {
        name: "restart",
        type: "expand",
        message: "Would you like to query more Pokémon?",
        choices: [
          {
            key: "a",
            value: "YES",
          },
          {
            key: "b",
            value: "NO",
          },
        ],
      },
    ])
    .then((answers) => {
      const { restart } = answers;

      if (restart === "YES") {
        getUserChoice();
      } else {
        process.exit(0);
      }
    });
};

// Gets limit and offset for query string
const getPokemonList = () => {
  inquirer
    .prompt([
      {
        name: "limit",
        type: "input",
        message: "Enter your limit:",
        validate: validateInput,
      },
      {
        name: "offset",
        type: "input",
        message: "Enter your offset:",
        validate: validateInput,
      },
    ])
    .then((answers) => {
      const { limit, offset } = answers;
      const QUERY_STR = `limit=${limit}&offset=${offset}`;
      const API_ENDPOINT = `https://pokeapi.co/api/v2/pokemon?${QUERY_STR}`;
      getAPIData(API_ENDPOINT);
    });
};

// Get's specific Pokemon's weight and height with the name or id of the pokemon
const getPokemonWeightHeight = () => {
  inquirer
    .prompt([
      {
        name: "nameOrId",
        type: "input",
        message:
          "Which Pokémon's height and weight would you like to know about? Enter the id or name of the Pokémon.",
        validate(val) {
          return val !== ""
            ? true
            : "Please enter the id or name of the Pokémon!";
        },
      },
    ])
    .then((answers) => {
      const { nameOrId } = answers;
      const API_ENDPOINT = `https://pokeapi.co/api/v2/pokemon/${nameOrId}`;
      getAPIData(API_ENDPOINT);
    });
};

// Get Pokemon's average height and weight from the pokemon_arr array
const getPokemonAverageWeightHeight = () => {
  const REQUESTS = [];

  for (const pokemon of pokemon_arr) {
    const { name } = pokemon;
    REQUESTS.push(axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`));
  }
  handleGetAverageWeightHeight(REQUESTS);
};

getUserChoice();

module.exports = validateInput;