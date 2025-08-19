function InfoCard(props) {
  const { header, content } = props;
  return (
    <div className="relative mt-2">
      <div className="font-bold  text-gray-900">
        
        {header}
      </div>
      <dd className="text-sm">{content}</dd>
    </div>
  );
}

export default InfoCard;
