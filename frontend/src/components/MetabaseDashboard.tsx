import React from 'react'

interface MetabaseDashboardProps{
    url: string;
    height?: string;
}

const MetabaseDashboard: React.FC<MetabaseDashboardProps> = ({url, height = "600px"}) =>{
    return(
        <div className="w-full flex justify-center">
            <iframe
                src={url}
                className={'w-full max-w-6xl rounded-xl shadow-lg border border-gray-200'}
                style={{height}}
                allowTransparency
                title='Metabase Dashboard'
            />
        </div>
    );
};

export default MetabaseDashboard;