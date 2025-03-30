const TopActionBar = ({ onCreateGroup }: { onCreateGroup: () => void }) => (
    <div className="flex justify-between items-center mb-8">
        {/* left */}
        <button className="p-2 hover:bg-gray-100 rounded-full">
            <img src="/group/search_button.png" className="w-6 h-6 rounded-full" />
        </button>

        {/* right */}
        <button
            onClick={onCreateGroup}
            className="text-green-600 hover:text-green-700 font-medium"
        >
            Create group
        </button>
    </div>
);
export default TopActionBar;