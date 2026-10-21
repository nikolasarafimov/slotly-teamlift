class InitialSlotlySchema1792531200000 {
  name = 'InitialSlotlySchema1792531200000'

  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE "slots" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "starts_at" timestamptz NOT NULL,
        "duration_minutes" integer NOT NULL,
        "is_booked" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "CHK_slots_duration"
          CHECK (
            "duration_minutes" >= 15
            AND "duration_minutes" <= 240
          )
      )
    `)

    await queryRunner.query(`
      CREATE INDEX "IDX_slots_starts_at"
      ON "slots" ("starts_at")
    `)

    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "slot_id" uuid NOT NULL,
        "guest_name" varchar(100) NOT NULL,
        "guest_email" varchar(254) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "FK_bookings_slot"
          FOREIGN KEY ("slot_id")
          REFERENCES "slots" ("id")
          ON DELETE RESTRICT
      )
    `)

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_bookings_slot_id"
      ON "bookings" ("slot_id")
    `)
  }

  async down(queryRunner) {
    await queryRunner.query(`
      DROP TABLE "bookings"
    `)

    await queryRunner.query(`
      DROP TABLE "slots"
    `)
  }
}

module.exports = {
  InitialSlotlySchema1792531200000,
}