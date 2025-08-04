import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Select, MenuItem, FormControl, InputLabel, CircularProgress } from '@mui/material';

const AttendanceTab = ({ group }) => {
    const [lessonDays, setLessonDays] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const year = new Date().getFullYear();
        // Fetch the calculated lesson days for the selected month and year
        api.get(`/core/groups/${group.id}/lesson_schedule/?year=${year}&month=${selectedMonth}`)
            .then(res => {
                setLessonDays(res.data.actual_lesson_dates || []);
                // Here you would also fetch the existing attendance records for these days
                // and populate the 'attendance' state.
                setIsLoading(false);
            });
    }, [group.id, selectedMonth]);

    return (
        <div className="space-y-4">
            <FormControl size="small">
                <InputLabel>Oy</InputLabel>
                <Select value={selectedMonth} label="Oy" onChange={e => setSelectedMonth(e.target.value)}>
                    {/* Map over months */}
                    <MenuItem value={7}>Iyul</MenuItem>
                    <MenuItem value={8}>Avgust</MenuItem>
                </Select>
            </FormControl>
            {isLoading ? <CircularProgress /> : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-dark-tertiary">
                                <th className="p-3 text-left">O'quvchilar</th>
                                {lessonDays.map(day => <th key={day} className="p-3 text-center">{new Date(day).getDate()}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {group.students_list.map(student => (
                                <tr key={student.id} className="border-b dark:border-dark-tertiary">
                                    <td className="p-3 font-medium">{student.full_name}</td>
                                    {lessonDays.map(day => (
                                        <td key={day} className="p-3 text-center">
                                            {/* Logic for checkboxes (present, absent, excused) goes here */}
                                            <input type="checkbox" />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AttendanceTab;