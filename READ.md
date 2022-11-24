# Docker Db Homework README


## Assumptions

- assumed this program was for this specific database and migration. As a result queries were hardcoded into the program with a simple npm start command
- Usually would run tests with mock data but given the nature of the assessment decided to test the connection and data itself
- Assumed that showing the new and corrupted records along with old data that didn't make it to the migrated database would be enough for the report.

## Instructions
- Have docker installed
- Run each docker image locally in separate terminals with:
  - docker	run	-p	5432:5432	guaranteedrate/homework-pre-migration:1607545060-a7085621
  - docker	run	-p	5433:5432	guaranteedrate/homework-post-migration:1607545060-a7085621
- run 
### `npm start`
- The program will run through the entire database so it's going to take a couple minutes. Watch for the "FINISHED" logs from both databases in the terminal to determine when the program is finished.
- The program will output a csv with the records. Open with excel.

- run tests
### `npm test`