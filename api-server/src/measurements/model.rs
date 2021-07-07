use chrono::NaiveDateTime;
use crate::db;
use crate::error_handler::CustomError;
use crate::schema::measurements;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use bigdecimal::BigDecimal;
use crate::sensors::{SensorsModel};
use uuid::Uuid;

#[derive(AsChangeset, Associations, Clone, Deserialize, Identifiable, Insertable, Queryable, Serialize)] 
#[belongs_to(SensorsModel, foreign_key = "sensor_id")]
#[table_name = "measurements"]
pub struct MeasurementsModel {
    pub id: Uuid,
    pub value: BigDecimal,
    pub sensor_id: Uuid,
    pub created_at: NaiveDateTime
}

impl MeasurementsModel {
    pub fn find_all() -> Result<Vec<Self>, CustomError> {
        let conn = db::connection()?;
        let measurements = measurements::table.load::<Self>(&conn)?;
        Ok(measurements)
    }

    pub fn find(id: Uuid) -> Result<Self, CustomError> {
        let conn = db::connection()?;
        let measurement = measurements::table.filter(measurements::id.eq(id)).first(&conn)?;
        Ok(measurement)
    }

    pub fn create(sensor_id: Uuid, value: BigDecimal) -> Result<Self, CustomError> {
        let conn = db::connection()?;
        let measurement = diesel::insert_into(measurements::table)
            .values((
                measurements::value.eq(value),
                measurements::sensor_id.eq(sensor_id)
            ))
            .get_result(&conn)?;
        SensorsModel::touch(sensor_id)?;
        Ok(measurement)
    }

    pub fn delete(id: Uuid) -> Result<usize, CustomError> {
        let conn = db::connection()?;
        let res = diesel::delete(measurements::table.filter(measurements::id.eq(id))).execute(&conn)?;
        Ok(res)
    }
}