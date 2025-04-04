import React, { useState, useMemo, useEffect } from "react"
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    TextField,
    FormControlLabel,
    Switch,
    Tooltip
} from "@material-ui/core"
import { makeStyles } from "@material-ui/core/styles"
import CreatableSelect from "react-select/creatable"
import { AIE_CATEGORIES } from "../Annotator/constants"
import { zIndices } from "../Annotator/constants"
import { getColorByCategory } from "../Annotator/reducers/general-reducer"
import { asMutable } from "seamless-immutable"
const useStyles = makeStyles({
    dialogContent: {
        minWidth: 600,
    },
    dialogTextField: {
        width: "100%",
        "& .MuiOutlinedInput-root": {
            "& fieldset": {
                borderColor: "rgba(255, 255, 255, 0.23)",
            },
            "&:hover fieldset": {
                borderColor: "rgba(255, 255, 255, 0.23)",
            },
        },
    },
    select: {
        marginBottom: 16,
    },
    tooltip: {
        backgroundColor: "rgba(0,0,0,0.9)",
        color: "#fff",
        fontSize: "14px",
        padding: "8px 12px",
        borderRadius: 4,
        maxWidth: 240,
        '& span': {
            color: '#fff',
            fontSize: '14px'
        }
    },
    tooltipArrow: {
        color: "rgba(0,0,0,0.9)"
    },
    popper: {
        zIndex: zIndices.modal + 4
    },
    // 🔥 Add this new class
    selectMenu: {
        backgroundColor: "#2f2f2f !important", // force override if needed
        maxHeight: "200px !important",
        overflowY: "auto !important",
        color: "white",
        zIndex: `${zIndices.modal + 1} !important`,
        "&::-webkit-scrollbar": {
            width: 8,
        },
        "&::-webkit-scrollbar-track": {
            background: "#2f2f2f",
        },
        "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#555",
            borderRadius: 6,
            border: "2px solid #2f2f2f",
        },
        scrollbarColor: "#555 #2f2f2f",
        scrollbarWidth: "thin",
    }
});


export const BulkEditDialog = ({
    open,
    onClose,
    deviceToEdit,
    deviceList,
    isUserDefinedDevice,
    onChangeDeviceName,
    dispatch,
    state,
}) => {
    const classes = useStyles()
    const [editMode, setEditMode] = useState('select')
    const [newDeviceName, setNewDeviceName] = useState("")
    const [selectedDevice, setSelectedDevice] = useState(null)
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [nameError, setNameError] = useState("")
    const [mutableDeviceList, setMutableDeviceList] = useState([])

    // Create category options
    const categoryOptions = useMemo(() => {
        return AIE_CATEGORIES.map(category => ({
            value: category,
            label: category
        }))
    }, [])

    // Get current device category
    const currentDeviceCategory = useMemo(() => {
        // make the device list mutable
        const mutableDeviceList = [...deviceList]
        const device = mutableDeviceList.find(d => d.symbol_name === deviceToEdit)
        return device?.category || null
    }, [deviceToEdit, deviceList])

    // Create device options
    const deviceOptions = useMemo(() => {
        // make the device list mutable
        const mutableDeviceList = [...deviceList]

        return mutableDeviceList.map(device => ({
            value: device.symbol_name,
            label: (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{device.symbol_name}</span>
                    <span style={{
                        marginLeft: 8,
                        fontSize: '0.8em',
                        opacity: 0.7,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        padding: '2px 6px',
                        borderRadius: 4
                    }}>
                        {device.category}
                    </span>
                </div>
            ),
            category: device.category,
            isUserDefined: device.user_defined
        }))
    }, [deviceList])

    // Set initial values when dialog opens or deviceToEdit changes
    useEffect(() => {
        // Only set values if dialog is open
        if (open) {
            const currentDevice = deviceList.find(d => d.symbol_name === deviceToEdit)
            if (currentDevice) {
                // Set initial device selection
                const deviceOption = {
                    value: currentDevice.symbol_name,
                    label: (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>{currentDevice.symbol_name}</span>
                            <span style={{
                                marginLeft: 8,
                                fontSize: '0.8em',
                                opacity: 0.7,
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                padding: '2px 6px',
                                borderRadius: 4
                            }}>
                                {currentDevice.category}
                            </span>
                        </div>
                    ),
                    category: currentDevice.category,
                    isUserDefined: currentDevice.user_defined
                }

                setSelectedDevice(deviceOption)

                // Set initial category
                setSelectedCategory({
                    value: currentDevice.category,
                    label: currentDevice.category,
                    isFixed: !currentDevice.user_defined
                })

                // Set initial name for rename mode
                setNewDeviceName(currentDevice.symbol_name)

                // Set initial edit mode based on whether device is user-defined
                // setEditMode(currentDevice.user_defined ? 'rename' : 'select')

                // Reset error state
                setNameError("")
            }
        }
    }, [open, deviceToEdit, deviceList])

    // Reset state when dialog closes
    const resetState = () => {
        setNewDeviceName("")
        setSelectedDevice(null)
        setSelectedCategory(null)
        setEditMode('select')
        setNameError("")
    }

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(resetState, 300)
            return () => clearTimeout(timer)
        }
    }, [open])

    const validateDeviceName = (newName) => {
        if (!newName.trim()) {
            setNameError("Device name cannot be empty")
            return false
        }

        const originalDevice = deviceList.find(d => d.symbol_name === deviceToEdit)
        const category = originalDevice ? originalDevice.category : "User Defined"

        const existingDevice = deviceList.find(d =>
            d.symbol_name === newName &&
            d.category === category &&
            d.symbol_name !== deviceToEdit
        )

        if (existingDevice) {
            setNameError(`A device named "${newName}" already exists in the "${category}" category`)
            return false
        }

        setNameError("")
        return true
    }

    const handleDeviceSelectChange = (newValue, actionMeta) => {
        if (actionMeta.action === "create-option") {
            setSelectedDevice({
                value: newValue.value,
                label: newValue.value,
                isUserDefined: true
            })
            setSelectedCategory(null)
        } else {
            setSelectedDevice(newValue)
            if (newValue?.category) {
                if (newValue.isUserDefined) {
                    setSelectedCategory({
                        value: newValue.category,
                        label: newValue.category
                    })
                } else {
                    setSelectedCategory({
                        value: newValue.category,
                        label: newValue.category,
                        isFixed: true
                    })
                }
            }
        }
        setNameError("")
    }

    const handleBulkEdit = () => {
        console.log("editMode", editMode)
        if (editMode === 'rename') {
            if (!validateDeviceName(newDeviceName)) {
                return
            }
            // Handle rename
            onChangeDeviceName(deviceToEdit, newDeviceName)
        } else {
            if (!selectedDevice || !selectedCategory) {
                setNameError("Please select both device and category")
                return
            }

            // Handle new category if created
            if (selectedCategory && !categoryOptions.find(c => c.value === selectedCategory.value)) {
                const newColor = "#" + Math.floor(Math.random() * 16777215).toString(16)
                dispatch({
                    type: "ADD_NEW_CATEGORY",
                    category: selectedCategory.value,
                    color: newColor
                })
            }

            // Handle new device
            if (selectedDevice && !deviceOptions.find(d => d.value === selectedDevice.value)) {
                const newDevice = {
                    symbol_name: selectedDevice.value,
                    category: selectedCategory.value,
                    user_defined: true
                }

                // Add to newDevicesToSave
                dispatch({
                    type: "ADD_OLD_DEVICE_TO_NEW_DEVICES",
                    device: newDevice
                })
            }

            // Apply bulk edit to all instances with the correct color
            dispatch({
                type: "BULK_EDIT_DEVICE_NAME_AND_CATEGORY",
                oldName: deviceToEdit,
                newName: selectedDevice.value,
                category: selectedCategory.value
            })
        }

        // Close dialog
        onClose()
    }

    const handleClose = () => {
        onClose()
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            TransitionProps={{
                onExited: resetState
            }}
            BackdropProps={{
                style: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    zIndex: zIndices.backdrop
                }
            }}
            PaperProps={{
                style: {
                    zIndex: zIndices.modal,
                    backgroundColor: '#333',
                    color: 'white'
                }
            }}
            style={{ zIndex: zIndices.modal }}
        >
            <DialogTitle style={{ color: 'white' }}>
                Edit all regions of {deviceToEdit}
            </DialogTitle>
            <DialogContent className={classes.dialogContent}>
                <Typography variant="body2" style={{ marginBottom: 16, color: 'white' }}>
                    {isUserDefinedDevice(deviceToEdit)
                        ? "You can rename this device or change it to another device."
                        : "Select an existing device or create a new one."}
                </Typography>

                {isUserDefinedDevice(deviceToEdit) && (
                    <div style={{ marginBottom: 16 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={editMode === 'rename'}
                                    onChange={(e) => {
                                        setEditMode(e.target.checked ? 'rename' : 'select')
                                        setNameError("")
                                    }}
                                    color="primary"
                                />
                            }
                            label={`Rename ${deviceToEdit} Instead of Changing Device`}
                            style={{ color: 'white' }}
                        />
                    </div>
                )}

                {(editMode === 'rename' && isUserDefinedDevice(deviceToEdit)) ? (
                    <>
                        <TextField
                            label="New Device Name"
                            variant="outlined"
                            className={classes.dialogTextField}
                            value={newDeviceName}
                            onChange={(e) => {
                                setNewDeviceName(e.target.value)
                                validateDeviceName(e.target.value)
                            }}
                            error={!!nameError}
                            helperText={nameError}
                            autoFocus
                            InputProps={{
                                style: { color: 'white' }
                            }}
                            InputLabelProps={{
                                style: { color: 'rgba(255, 255, 255, 0.7)' }
                            }}
                        />
                        {currentDeviceCategory && (
                            <div style={{
                                marginTop: 8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                            }}>
                                <div style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: getColorByCategory(state, currentDeviceCategory)
                                }} />
                                <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                    {currentDeviceCategory}
                                </Typography>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8, }}>

                            <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.7)', marginTop: 8, fontWeight: 'bold' }}>
                                Select or create a device
                            </Typography>
                            <CreatableSelect
                                value={selectedDevice}
                                onChange={handleDeviceSelectChange}
                                options={deviceOptions}
                                className={classes.select}
                                placeholder="Select or create a device..."
                                isClearable
                                menuClassName={classes.selectMenu} // 👈 Apply the scrollbar style here
                                styles={{
                                    control: (provided) => ({
                                        ...provided,
                                        borderColor: "#1DA1F2",
                                        backgroundColor: '#424242',
                                        "&:hover": {
                                            borderColor: "#1DA1F2",
                                        },
                                        fontWeight: 500,
                                        fontSize: '14px',
                                    }),
                                    placeholder: (provided) => ({
                                        ...provided,
                                        color: "#aaa",
                                        fontWeight: 400,
                                        fontSize: '14px'
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isFocused ? '#555' : '#2f2f2f',
                                        color: 'white',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                    }),
                                    singleValue: (base) => ({
                                        ...base,
                                        color: 'white',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                    }),
                                    input: (base) => ({
                                        ...base,
                                        color: 'white',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                    }),
                                    menuPortal: (base) => ({
                                        ...base,
                                        zIndex: zIndices.modal + 5.
                                    })
                                }}
                                menuPortalTarget={document.body}
                                style={{ marginTop: 16 }}
                            />

                            <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.7)', marginTop: 8, fontWeight: 'bold' }}>
                                Device Category:
                            </Typography>
                            <CreatableSelect
                                value={selectedCategory}
                                onChange={(newValue) => {
                                    if (selectedDevice?.isUserDefined) {
                                        setSelectedCategory(newValue)
                                        setNameError("")
                                    }
                                }}
                                options={categoryOptions}
                                isDisabled={selectedDevice && !selectedDevice.isUserDefined}
                                placeholder={
                                    selectedDevice && !selectedDevice.isUserDefined
                                        ? "Category is fixed for existing devices"
                                        : "Select a category..."
                                }
                                isClearable={selectedDevice?.isUserDefined}
                                menuClassName={classes.selectMenu} // 👈 Apply the scrollbar style here
                                styles={{
                                    control: (provided) => ({
                                        ...provided,
                                        borderColor: "#1DA1F2",
                                        backgroundColor: '#424242',
                                        "&:hover": {
                                            borderColor: "#1DA1F2",
                                        },
                                        fontWeight: 500,
                                        fontSize: '14px',
                                    }),
                                    placeholder: (provided) => ({
                                        ...provided,
                                        color: "#aaa",
                                        fontWeight: 400,
                                        fontSize: '14px'
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isFocused ? '#555' : '#2f2f2f',
                                        color: 'white',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                    }),
                                    singleValue: (base) => ({
                                        ...base,
                                        color: 'white',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                    }),
                                    input: (base) => ({
                                        ...base,
                                        color: 'white',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                    }),
                                    menuPortal: (base) => ({
                                        ...base,
                                        zIndex: zIndices.modal + 5.
                                    })
                                }}
                                menuPortalTarget={document.body}
                                style={{ marginTop: 16 }}
                            />

                            <div style={{ marginTop: 8, marginBottom: 8 }} >

                                {
                                    selectedDevice && !selectedDevice.isUserDefined && (
                                        <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.7)', marginTop: 8, fontWeight: 'bold' }}>
                                            Category can only be changed for user defined devices.
                                        </Typography>
                                    )
                                }
                            </div>
                        </div>
                    </>
                )}
                {nameError && (
                    <Typography
                        variant="caption"
                        style={{ color: '#f44336', marginTop: 4 }}
                    >
                        {nameError}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={handleClose}
                    style={{ color: '#64b5f6' }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleBulkEdit}
                    style={{ color: '#64b5f6' }}
                    disabled={
                        (editMode === 'rename' && (!newDeviceName.trim() || !!nameError)) ||
                        (editMode === 'select' && (!selectedDevice || !selectedCategory))
                    }
                >
                    Apply
                </Button>
            </DialogActions>
        </Dialog>
    )
} 