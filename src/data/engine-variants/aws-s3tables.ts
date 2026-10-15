// The AWS S3 Tables variant of the AWS engines. Imported lazily (see
// loadEngineData in ../load-data.ts) so it stays out of the first-load bundle
// until someone switches the AWS group to S3 Tables.
//
// Order: athena, emr, glue, managed-flink, redshift-s3, aurora (the same order
// as the S3 buckets variant, which the merged column order depends on).
import type { EngineFile } from "../load-data";
import tAthena from "../platforms/aws/s3tables/athena/athena.json";
import tEmr from "../platforms/aws/s3tables/emr/emr.json";
import tGlue from "../platforms/aws/s3tables/glue/glue.json";
import tManagedFlink from "../platforms/aws/s3tables/managed-flink/managed-flink.json";
import tRedshift from "../platforms/aws/s3tables/redshift-s3/redshift-s3.json";
import tAurora from "../platforms/aws/s3tables/aurora/aurora.json";

export const awsTablesEngines: EngineFile[] = [
  tAthena,
  tEmr,
  tGlue,
  tManagedFlink,
  tRedshift,
  tAurora,
];
