import { z } from "zod";

export enum TimeBucketIntEnum {
  Career = 1,
  Sleep = 2,
  Maintenance = 3,
  Fitness = 4,
  Learning = 5,
  Social = 6,
  Entertainment = 7,
  PersonalDev = 8,
}
export const ZTimeBucketIntEnum = z.nativeEnum(TimeBucketIntEnum);

export enum TimeBucketLabelEnum {
  Career = "career",
  Sleep = "sleep",
  Maintenance = "maintenance",
  Fitness = "fitness",
  Learning = "learning",
  Social = "social",
  Entertainment = "entertainment",
  PersonalDev = "personal-dev",
}
export const ZTimeBucketLabelEnum = z.nativeEnum(TimeBucketLabelEnum);

export const timeBucketIntToLabel: Record<TimeBucketIntEnum, TimeBucketLabelEnum> = {
  [TimeBucketIntEnum.Career]: TimeBucketLabelEnum.Career,
  [TimeBucketIntEnum.Sleep]: TimeBucketLabelEnum.Sleep,
  [TimeBucketIntEnum.Maintenance]: TimeBucketLabelEnum.Maintenance,
  [TimeBucketIntEnum.Fitness]: TimeBucketLabelEnum.Fitness,
  [TimeBucketIntEnum.Learning]: TimeBucketLabelEnum.Learning,
  [TimeBucketIntEnum.Social]: TimeBucketLabelEnum.Social,
  [TimeBucketIntEnum.Entertainment]: TimeBucketLabelEnum.Entertainment,
  [TimeBucketIntEnum.PersonalDev]: TimeBucketLabelEnum.PersonalDev,
};

export const timeBucketLabelToInt: Record<TimeBucketLabelEnum, TimeBucketIntEnum> = {
  [TimeBucketLabelEnum.Career]: TimeBucketIntEnum.Career,
  [TimeBucketLabelEnum.Sleep]: TimeBucketIntEnum.Sleep,
  [TimeBucketLabelEnum.Maintenance]: TimeBucketIntEnum.Maintenance,
  [TimeBucketLabelEnum.Fitness]: TimeBucketIntEnum.Fitness,
  [TimeBucketLabelEnum.Learning]: TimeBucketIntEnum.Learning,
  [TimeBucketLabelEnum.Social]: TimeBucketIntEnum.Social,
  [TimeBucketLabelEnum.Entertainment]: TimeBucketIntEnum.Entertainment,
  [TimeBucketLabelEnum.PersonalDev]: TimeBucketIntEnum.PersonalDev,
};
