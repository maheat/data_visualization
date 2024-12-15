document.addEventListener('DOMContentLoaded', () => {
    const addRowBtn = document.getElementById('addRow');
    const dataBody = document.getElementById('dataBody');

    // Add a new row
    addRowBtn.addEventListener('click', () => {
        const rowIndex = dataBody.children.length; // Count existing rows
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td><input type="text" name="data[${rowIndex}][x]" class="px-4 py-2 w-full bg-gray-800 text-white rounded" placeholder="e.g., 1"></td>
            <td><input type="text" name="data[${rowIndex}][y]" class="px-4 py-2 w-full bg-gray-800 text-white rounded" placeholder="e.g., 10"></td>
            <td><button type="button" class="removeRow bg-red-500 px-4 py-2 rounded">Remove</button></td>
        `;
        dataBody.appendChild(newRow);
    });

    // Remove a row
    dataBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('removeRow')) {
            e.target.closest('tr').remove();
        }
    });
});
