// Snowflake with an external volume (customer cloud storage). Imported lazily
// so it stays out of the first-load bundle until someone switches the Snowflake
// group to External. It carries the same platform id ("snowflake") as the
// managed file, so filters survive the toggle.
import snowflakeExternal from "../platforms/snowflake/external/snowflake/snowflake.json";

export { snowflakeExternal };
