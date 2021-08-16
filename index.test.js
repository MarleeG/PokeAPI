const index = require("./index");

test("Validate if input is a number.", () => {
  expect(index('1')).toBe(true);
  expect(index('77gh')).toBe(true);
  expect(index('gh8')).toBe("Please enter a valid number!");
  expect(index('adfs')).toBe("Please enter a valid number!");
  expect(index(')(*^##')).toBe("Please enter a valid number!");
});