interface ListData {
    name: string;
    img: string;
    handleClick: () => void;
}

const SimpleList = ({ name, img, handleClick }: ListData) => {
    return (
        <div>
            <section
                className={`flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors p-2 rounded-lg`}
                onClick={handleClick}
            >
                <div className="flex items-center flex-1">
                    <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden">
                        <img
                            src={img}
                            alt={`${name} list logo`}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <h2 className="ml-4 text-lg font-semibold text-gray-800">
                        {name}
                    </h2>
                </div>
            </section>
            <div className="w-full h-px bg-gray-200"></div>
        </div>
        
    );
};

export default SimpleList;