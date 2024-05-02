import { Select } from "@material-ui/core"
import React, { useState } from "react"
import CreatableSelect from "react-select/creatable"
import { asMutable } from "seamless-immutable"

export const NewDeviceRegionLabel = (
  region,
  deviceOptions,
  onNewDeviceAdded,
  onChangeDevice,
  onSelectCategory,
  isNewDevice
) => {
  console.log("DBG: NewDeviceRegionLabel")
  console.log(region)
  console.log(deviceOptions.length)
  const [selectedCategory, setSelectedCategory] = useState(null)
  return (
    <>
      <CreatableSelect
        placeholder="Device"
        onChange={(o, actionMeta) => {
          const isActionCreate = false
          if (actionMeta.action === "create-option") {
            isActionCreate = true
          }
          onNewDeviceAdded(isActionCreate, o.value)
          return onChangeDevice({
            ...region,
            cls: o.value,
          })
        }}
        value={region.cls ? { label: region.cls, value: region.cls } : null}
        options={deviceOptions}
      />
      {isNewDevice && (
        <Select
          placeholder="Select System"
          onChange={(e) => {
            onSelectCategory(e)
          }}
          value={selectedCategory}
        />
      )}
    </>
  )
}
