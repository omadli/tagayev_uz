import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../../services/api';
import DataTable from 'react-data-table-component';
import toast from 'react-hot-toast';

const StudentPaymentsTab = ({ studentId }) => {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = { student: studentId };
            const response = await api.get('/finance/transactions/', { params });
            setTransactions(response.data.results || response.data);
        } catch { toast.error("To'lovlarni yuklab bo'lmadi."); }
        finally { setIsLoading(false); }
    }, [studentId]);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    const columns = [
        { name: "Sana", selector: row => new Date(row.created_at).toLocaleDateString() },
        { name: "Guruh", selector: row => row.group_name },
        { name: "Debet (Qarz)", cell: row => row.transaction_type === 'DEBIT' ? `${row.amount} so'm` : '-' },
        { name: "Kredit (To'lov)", cell: row => row.transaction_type === 'CREDIT' ? `${row.amount} so'm` : '-' },
        { name: "Izoh", selector: row => row.comment },
    ];

    return (
        <div>
            <DataTable columns={columns} data={transactions} progressPending={isLoading} pagination />
        </div>
    );
};
export default StudentPaymentsTab;